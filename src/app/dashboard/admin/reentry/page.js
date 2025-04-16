"use client";
import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, MenuItem, FormControl, InputLabel, Select, Card, CardContent } from '@mui/material';
import { fetchAPI } from '@/utils/api';
import Charts from '@/components/Charts';
import DataTable from '@/components/DataTable';

export default function ReentryAdminDashboard() {
  // Filter state
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [circuits, setCircuits] = useState([]);
  const [schools, setSchools] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCircuit, setSelectedCircuit] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [summary, setSummary] = useState({ inSchool: 0, outOfSchool: 0, reentry: 0 });

  // Chart and table state
  const [trendData, setTrendData] = useState([]);
  const [districtData, setDistrictData] = useState([]);
  const [tableRows, setTableRows] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  // Fetch filter options on mount
  useEffect(() => {
    fetchAPI('regions').then(setRegions);
    fetchAPI('districts').then(setDistricts);
    fetchAPI('circuits').then(setCircuits);
    fetchAPI('schools').then(setSchools);
    fetchAPI('system-config').then(cfg => setTerms(cfg.availableTerms || []));
  }, []);

  // Fetch summary data when filters change
  useEffect(() => {
    const fetchSummary = async () => {
      const params = [];
      if (selectedRegion) params.push(`regionId=${selectedRegion}`);
      if (selectedDistrict) params.push(`districtId=${selectedDistrict}`);
      if (selectedCircuit) params.push(`circuitId=${selectedCircuit}`);
      if (selectedSchool) params.push(`schoolId=${selectedSchool}`);
      if (selectedTerm) params.push(`term=${encodeURIComponent(selectedTerm)}`);
      const url = `/api/dashboard/reentry-summary${params.length ? '?' + params.join('&') : ''}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        setSummary({
          inSchool: data.inSchool || 0,
          outOfSchool: data.outOfSchool || 0,
          reentry: data.reentry || 0,
        });
      } catch {
        setSummary({ inSchool: 0, outOfSchool: 0, reentry: 0 });
      }
    };
    fetchSummary();
  }, [selectedRegion, selectedDistrict, selectedCircuit, selectedSchool, selectedTerm]);

  // Fetch chart and table data when filters change
  useEffect(() => {
    // Fetch trend data (re-entries over time)
    fetch(`/api/dashboard/reentry-trends?${[
      selectedRegion && `regionId=${selectedRegion}`,
      selectedDistrict && `districtId=${selectedDistrict}`,
      selectedCircuit && `circuitId=${selectedCircuit}`,
      selectedSchool && `schoolId=${selectedSchool}`,
      selectedTerm && `term=${encodeURIComponent(selectedTerm)}`
    ].filter(Boolean).join('&')}`)
      .then(res => res.json())
      .then(data => setTrendData(data.trends || []));
    // Fetch district bar chart data
    fetch(`/api/dashboard/reentry-districts?${[
      selectedRegion && `regionId=${selectedRegion}`,
      selectedTerm && `term=${encodeURIComponent(selectedTerm)}`
    ].filter(Boolean).join('&')}`)
      .then(res => res.json())
      .then(data => setDistrictData(data.districts || []));
    // Fetch table data
    setTableLoading(true);
    fetch(`/api/dashboard/reentry-table?${[
      selectedRegion && `regionId=${selectedRegion}`,
      selectedDistrict && `districtId=${selectedDistrict}`,
      selectedCircuit && `circuitId=${selectedCircuit}`,
      selectedSchool && `schoolId=${selectedSchool}`,
      selectedTerm && `term=${encodeURIComponent(selectedTerm)}`
    ].filter(Boolean).join('&')}`)
      .then(res => res.json())
      .then(data => setTableRows(data.rows || []))
      .finally(() => setTableLoading(false));
  }, [selectedRegion, selectedDistrict, selectedCircuit, selectedSchool, selectedTerm]);

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f7fa', minHeight: 'calc(100vh - 64px)' }}>
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
          Pregnancy & Re-entry Analytics Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          View analytics, trends, and raw data for pregnancy and re-entry submissions. Use the filters and cards below to explore the data by region, district, circuit, school, term, and more.
        </Typography>
      </Paper>
      {/* Filter Controls */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Region</InputLabel>
              <Select value={selectedRegion} label="Region" onChange={e => setSelectedRegion(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {regions.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>District</InputLabel>
              <Select value={selectedDistrict} label="District" onChange={e => setSelectedDistrict(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {districts.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Circuit</InputLabel>
              <Select value={selectedCircuit} label="Circuit" onChange={e => setSelectedCircuit(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {circuits.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>School</InputLabel>
              <Select value={selectedSchool} label="School" onChange={e => setSelectedSchool(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {schools.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Term</InputLabel>
              <Select value={selectedTerm} label="Term" onChange={e => setSelectedTerm(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {terms.map(t => <MenuItem key={t.id} value={t.label}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography variant="h6" color="primary">Pregnant Girls In School</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{summary.inSchool}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#ffebee' }}>
            <CardContent>
              <Typography variant="h6" color="error">Pregnant Girls Out of School</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{summary.outOfSchool}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent>
              <Typography variant="h6" color="success.main">Re-entry Count</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{summary.reentry}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Charts Section */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Re-entry Trends (Line Graph)</Typography>
            <Charts
              type="line"
              height={320}
              options={{
                chart: { id: 'reentry-trend' },
                xaxis: { categories: trendData.map(d => d.period) },
                yaxis: { title: { text: 'Re-entries' } },
                stroke: { curve: 'smooth' },
                dataLabels: { enabled: false },
              }}
              series={[{ name: 'Re-entries', data: trendData.map(d => d.count) }]}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Re-entries by District (Bar Chart)</Typography>
            <Charts
              type="bar"
              height={320}
              options={{
                chart: { id: 'reentry-district' },
                xaxis: { categories: districtData.map(d => d.district) },
                yaxis: { title: { text: 'Re-entries' } },
                dataLabels: { enabled: false },
              }}
              series={[{ name: 'Re-entries', data: districtData.map(d => d.count) }]}
            />
          </Paper>
        </Grid>
      </Grid>
      {/* Data Table Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Raw Submissions</Typography>
        <DataTable
          columns={[
            { field: 'submitted_at', headerName: 'Date', width: 120 },
            { field: 'school_name', headerName: 'School', width: 180 },
            { field: 'district_name', headerName: 'District', width: 140 },
            { field: 'region_name', headerName: 'Region', width: 140 },
            { field: 'thematic_area', headerName: 'Thematic Area', width: 160 },
            { field: 'question', headerName: 'Question', width: 220 },
            { field: 'response_number', headerName: 'Number', width: 100 },
            { field: 'response_text', headerName: 'Text', width: 180 },
            { field: 'first_name', headerName: 'User', width: 120, valueFormatter: ({ row }) => `${row.first_name || ''} ${row.last_name || ''}` },
          ]}
          rows={tableRows}
          pageSize={20}
          loading={tableLoading}
        />
      </Paper>
    </Box>
  );
}
