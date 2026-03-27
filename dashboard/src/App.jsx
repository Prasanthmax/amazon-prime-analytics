import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Legend
} from 'recharts';
import {
  Film, Tv, Play, Clock, Star, Award, Calendar, Percent, SlidersHorizontal, X
} from 'lucide-react';
import Papa from 'papaparse';
import './index.css';

export default function App() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Slicer states
  const [selectedDecade, setSelectedDecade] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedGenre, setSelectedGenre] = useState('All');

  // Available slicer options (derived from data)
  const [decades, setDecades] = useState([]);
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    Papa.parse('/amazon_prime_processed.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const raw = results.data.filter(item => item.show_id && item.type);
        setRawData(raw);

        // Extract unique decades in order
        const decadeOrder = ['1920s', '1930s', '1940s', '1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];
        const uniqueDecades = decadeOrder.filter(d => raw.some(r => r.decade === d));
        setDecades(uniqueDecades);

        // Extract top genres
        const gc = {};
        raw.forEach(r => {
          const g = r.primary_genre;
          if (g && g.trim()) gc[g] = (gc[g] || 0) + 1;
        });
        const topGenres = Object.entries(gc)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name]) => name);
        setGenres(topGenres);

        setLoading(false);
      }
    });
  }, []);

  // Filtered data based on slicers
  const filteredData = useMemo(() => {
    let d = rawData;
    if (selectedDecade !== 'All') d = d.filter(r => r.decade === selectedDecade);
    if (selectedType !== 'All') d = d.filter(r => r.type === selectedType);
    if (selectedGenre !== 'All') d = d.filter(r => r.primary_genre === selectedGenre);
    return d;
  }, [rawData, selectedDecade, selectedType, selectedGenre]);

  // Compute all analytics from filtered data
  const analytics = useMemo(() => {
    const data = filteredData;
    if (data.length === 0) {
      return {
        kpiCards: [], moviesVsTv: [], ratingGroupData: [], genreFrequency: [],
        decadeData: [], seasonDistribution: [], durationBuckets: [], ratingBreakdown: []
      };
    }

    let movies = 0, tvShows = 0, totalMovieDuration = 0, movieDurationCount = 0;
    const genreCounts = {}, ratingCounts = {}, ratingGroupCounts = {}, decadeCounts = {}, seasonCounts = {};
    const releaseYears = [];
    let singleSeasonShows = 0;
    let durUnder60 = 0, dur60to90 = 0, dur90to120 = 0, durOver120 = 0;

    data.forEach(row => {
      if (row.type === 'Movie') {
        movies++;
        const dur = parseFloat(row.duration_minutes);
        if (!isNaN(dur) && dur > 0) {
          totalMovieDuration += dur;
          movieDurationCount++;
          if (dur < 60) durUnder60++;
          else if (dur <= 90) dur60to90++;
          else if (dur <= 120) dur90to120++;
          else durOver120++;
        }
      } else if (row.type === 'TV Show') {
        tvShows++;
        const seasons = parseFloat(row.seasons);
        if (!isNaN(seasons) && seasons > 0) {
          const sKey = seasons >= 7 ? '7+' : String(Math.floor(seasons));
          seasonCounts[sKey] = (seasonCounts[sKey] || 0) + 1;
          if (seasons === 1) singleSeasonShows++;
        }
      }

      const genre = row.primary_genre;
      if (genre && genre.trim()) genreCounts[genre] = (genreCounts[genre] || 0) + 1;

      const rating = row.rating;
      if (rating && rating.trim()) ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;

      const rg = row.rating_group;
      if (rg && rg.trim()) ratingGroupCounts[rg] = (ratingGroupCounts[rg] || 0) + 1;

      const decade = row.decade;
      if (decade && decade.trim()) decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;

      const yr = parseInt(row.release_year);
      if (!isNaN(yr)) releaseYears.push(yr);
    });

    const avgMovieDuration = movieDurationCount > 0 ? Math.round(totalMovieDuration / movieDurationCount) : 0;
    const minYear = releaseYears.length > 0 ? Math.min(...releaseYears) : 0;
    const maxYear = releaseYears.length > 0 ? Math.max(...releaseYears) : 0;
    const releaseSpan = maxYear - minYear;

    let topRating = '—', topRatingCount = 0;
    Object.entries(ratingCounts).forEach(([r, c]) => { if (c > topRatingCount) { topRating = r; topRatingCount = c; } });

    let topGenre = '—', topGenreCount = 0;
    Object.entries(genreCounts).forEach(([g, c]) => { if (c > topGenreCount) { topGenre = g; topGenreCount = c; } });

    const totalGenreTags = Object.values(genreCounts).reduce((s, v) => s + v, 0);
    const singleSeasonPct = tvShows > 0 ? Math.round((singleSeasonShows / tvShows) * 100) : 0;

    const kpiCards = [
      { title: 'Total Titles', value: data.length.toLocaleString(), subtitle: 'Movies + TV Shows', accent: 'var(--accent-blue)' },
      { title: 'Movies', value: movies.toLocaleString(), subtitle: `${data.length > 0 ? ((movies / data.length) * 100).toFixed(1) : 0}% of catalog`, accent: 'var(--accent-cyan)' },
      { title: 'TV Shows', value: tvShows.toLocaleString(), subtitle: `${data.length > 0 ? ((tvShows / data.length) * 100).toFixed(1) : 0}% of catalog`, accent: 'var(--accent-purple)' },
      { title: 'Avg movie length', value: `${avgMovieDuration} min`, subtitle: `Based on ${movieDurationCount.toLocaleString()} movies`, accent: 'var(--accent-amber)' },
      { title: 'Release span', value: releaseSpan > 0 ? `${releaseSpan} yrs` : '—', subtitle: releaseSpan > 0 ? `${minYear} – ${maxYear}` : 'N/A', accent: 'var(--accent-green)' },
      { title: 'Top rating', value: topRating, subtitle: `${topRatingCount.toLocaleString()} titles (${data.length > 0 ? ((topRatingCount / data.length) * 100).toFixed(1) : 0}%)`, accent: 'var(--accent-rose)' },
      { title: 'Top genre', value: topGenre, subtitle: `${totalGenreTags.toLocaleString()} genre tags`, accent: 'var(--accent-blue)' },
      { title: 'Single-season shows', value: tvShows > 0 ? `${singleSeasonPct}%` : '—', subtitle: tvShows > 0 ? `${singleSeasonShows.toLocaleString()} of ${tvShows.toLocaleString()} TV shows` : 'No TV shows', accent: 'var(--accent-cyan)' }
    ];

    const moviePct = data.length > 0 ? ((movies / data.length) * 100).toFixed(1) : 0;
    const tvPct = data.length > 0 ? ((tvShows / data.length) * 100).toFixed(1) : 0;
    const moviesVsTv = [
      { name: `Movie ${moviePct}%`, value: movies },
      { name: `TV Show ${tvPct}%`, value: tvShows }
    ];

    const ratingGroupData = Object.entries(ratingGroupCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const genreFrequency = Object.entries(genreCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    const decadeOrder = ['1920s', '1930s', '1940s', '1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];
    const decadeData = decadeOrder.filter(d => decadeCounts[d]).map(d => ({ name: d, count: decadeCounts[d] }));

    const seasonOrder = ['1', '2', '3', '4', '5', '6', '7+'];
    const seasonDistribution = seasonOrder.filter(s => seasonCounts[s]).map(s => ({ name: s, count: seasonCounts[s] }));

    const durationBuckets = [
      { name: '<60 min', count: durUnder60 },
      { name: '60–90', count: dur60to90 },
      { name: '90–120', count: dur90to120 },
      { name: '>120 min', count: durOver120 }
    ];

    const ratingBreakdown = Object.entries(ratingCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    return { kpiCards, moviesVsTv, ratingGroupData, genreFrequency, decadeData, seasonDistribution, durationBuckets, ratingBreakdown };
  }, [filteredData]);

  const hasActiveFilter = selectedDecade !== 'All' || selectedType !== 'All' || selectedGenre !== 'All';

  const clearAllFilters = () => {
    setSelectedDecade('All');
    setSelectedType('All');
    setSelectedGenre('All');
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <span>Loading Amazon Prime Dataset...</span>
      </div>
    );
  }

  const DONUT_COLORS_TYPE = ['#3b82f6', '#8b5cf6'];
  const DONUT_COLORS_RATING = ['#ef4444', '#06b6d4', '#10b981', '#f59e0b', '#6366f1'];
  const BAR_COLOR = '#3b82f6';
  const BUCKET_COLORS = ['#3b82f6', '#06b6d4', '#f59e0b', '#ef4444'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{payload[0].payload.name || payload[0].name}</p>
          <p className="tooltip-value">{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return percent > 0.05 ? (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  const { kpiCards, moviesVsTv, ratingGroupData, genreFrequency, decadeData, seasonDistribution, durationBuckets, ratingBreakdown } = analytics;

  return (
    <div className="dashboard-container">
      {/* ── Dashboard Title ─── */}
      <header className="dashboard-header">
        <div className="dashboard-title-row">
          <div>
            <h1 className="dashboard-title">Amazon Prime Video Analytics</h1>
            <p className="dashboard-subtitle">Content catalog insights · {rawData.length.toLocaleString()} titles analyzed</p>
          </div>
          {hasActiveFilter && (
            <motion.button
              className="clear-filters-btn"
              onClick={clearAllFilters}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <X size={14} />
              Clear all filters
            </motion.button>
          )}
        </div>
      </header>

      {/* ── Slicers ─── */}
      <section className="slicer-section">
        <div className="slicer-bar">
          <div className="slicer-icon">
            <SlidersHorizontal size={16} />
          </div>

          {/* Type Slicer */}
          <div className="slicer-group">
            <span className="slicer-label">Type</span>
            <div className="slicer-chips">
              {['All', 'Movie', 'TV Show'].map(opt => (
                <button
                  key={opt}
                  className={`slicer-chip ${selectedType === opt ? 'active' : ''}`}
                  onClick={() => setSelectedType(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="slicer-divider" />

          {/* Decade Slicer */}
          <div className="slicer-group">
            <span className="slicer-label">Decade</span>
            <div className="slicer-chips">
              <button
                className={`slicer-chip ${selectedDecade === 'All' ? 'active' : ''}`}
                onClick={() => setSelectedDecade('All')}
              >
                All
              </button>
              {decades.map(d => (
                <button
                  key={d}
                  className={`slicer-chip ${selectedDecade === d ? 'active' : ''}`}
                  onClick={() => setSelectedDecade(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="slicer-divider" />

          {/* Genre Slicer */}
          <div className="slicer-group">
            <span className="slicer-label">Genre</span>
            <div className="slicer-chips">
              <button
                className={`slicer-chip ${selectedGenre === 'All' ? 'active' : ''}`}
                onClick={() => setSelectedGenre('All')}
              >
                All
              </button>
              {genres.map(g => (
                <button
                  key={g}
                  className={`slicer-chip ${selectedGenre === g ? 'active' : ''}`}
                  onClick={() => setSelectedGenre(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active filter summary */}
        {hasActiveFilter && (
          <motion.div
            className="filter-summary"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            Showing <strong>{filteredData.length.toLocaleString()}</strong> of {rawData.length.toLocaleString()} titles
            {selectedType !== 'All' && <span className="filter-tag">{selectedType}</span>}
            {selectedDecade !== 'All' && <span className="filter-tag">{selectedDecade}</span>}
            {selectedGenre !== 'All' && <span className="filter-tag">{selectedGenre}</span>}
          </motion.div>
        )}
      </section>

      {/* ── Section: Overview KPI Cards ─── */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">OVERVIEW — {filteredData.length.toLocaleString()} TITLES</h2>
        </div>
        <div className="kpi-grid-8">
          {kpiCards.map((card, i) => (
            <motion.div
              key={`${card.title}-${card.value}`}
              className="kpi-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
            >
              <div className="kpi-label">{card.title}</div>
              <div className="kpi-value" style={{ color: card.accent }}>{card.value}</div>
              <div className="kpi-subtitle">{card.subtitle}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Section: Content Type & Audience ─── */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">CONTENT TYPE & AUDIENCE</h2>
        </div>
        <div className="charts-row-2">
          <motion.div className="chart-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <div className="chart-title">Movies vs TV Shows</div>
            <div className="chart-container donut-height">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={moviesVsTv} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value" stroke="none" labelLine={false} label={renderDonutLabel}>
                    {moviesVsTv.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS_TYPE[index]} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div className="chart-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <div className="chart-title">Audience rating group</div>
            <div className="chart-container donut-height">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ratingGroupData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value" stroke="none" labelLine={false} label={renderDonutLabel}>
                    {ratingGroupData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS_RATING[index % DONUT_COLORS_RATING.length]} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Section: Genre Breakdown ─── */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">GENRE BREAKDOWN (TOP 10)</h2>
        </div>
        <motion.div className="chart-card full-width" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <div className="chart-title">Genre tag frequency</div>
          <div className="chart-container bar-tall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genreFrequency} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                <XAxis type="number" stroke="var(--text-secondary)" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-primary)" tick={{ fontSize: 12, fill: 'var(--text-primary)' }} axisLine={false} tickLine={false} width={80} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" fill={BAR_COLOR} radius={[0, 4, 4, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </section>

      {/* ── Section: Release Decade Distribution ─── */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">RELEASE DECADE DISTRIBUTION</h2>
        </div>
        <motion.div className="chart-card full-width" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <div className="chart-title">Titles by decade of release</div>
          <div className="chart-container bar-tall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={decadeData} margin={{ top: 10, right: 30, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                  {decadeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.count > 1000 ? '#3b82f6' : '#1e3a5f'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </section>

      {/* ── Section: TV Show Seasons & Movie Duration ─── */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">TV SHOW SEASONS</h2>
        </div>
        <div className="charts-row-2">
          <motion.div className="chart-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <div className="chart-title">Season count distribution</div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seasonDistribution} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div className="chart-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <div className="chart-title">Movie duration buckets</div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={durationBuckets} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="count" stroke="none" labelLine={false} label={renderDonutLabel}>
                    {durationBuckets.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BUCKET_COLORS[index]} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Section: Rating Breakdown ─── */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">RATING BREAKDOWN</h2>
        </div>
        <motion.div className="chart-card full-width" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <div className="chart-title">Individual content ratings</div>
          <div className="chart-container bar-tall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingBreakdown} margin={{ top: 10, right: 30, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 11, fill: 'var(--text-secondary)', angle: -35, textAnchor: 'end' }} axisLine={false} tickLine={false} height={50} />
                <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={28}>
                  {ratingBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index < 3 ? '#3b82f6' : index < 6 ? '#6366f1' : '#1e3a5f'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
