// cms.js
const { useState, useEffect } = React;
const { createRoot } = ReactDOM;
const { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } = Recharts;

const CMS = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [supervisorFilter, setSupervisorFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data from CSV
  useEffect(() => {
    fetch('powerapps-test.csv')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.text();
      })
      .then(csvText => {
        const parsedData = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
          transform: (value) => value.trim(),
          complete: (result) => {
            const cleanedData = result.data.map(row => ({
              ...row,
              'SOW Estimated Cost': parseFloat(row['SOW Estimated Cost']) || 0
            })).filter(row => row['NTP Number']);
            setData(cleanedData);
            setFilteredData(cleanedData);
            setLoading(false);
          }
        });
      })
      .catch(error => {
        setError('Failed to load data: ' + error.message);
        setLoading(false);
      });
  }, []);

  // Filter by supervisor
  const handleFilterChange = (e) => {
    const value = e.target.value;
    setSupervisorFilter(value);
    const filtered = data.filter(row =>
      !value || row['Assigned Supervisor'] === value
    );
    setFilteredData(filtered);
  };

  // Calculate total cost
  const totalCost = filteredData.reduce((sum, row) => sum + (parseFloat(row['SOW Estimated Cost']) || 0), 0);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Market 1 CMS</h1>
      <div className="flex mb-4">
        <select
          className="p-2 bg-gray-800 text-white rounded"
          value={supervisorFilter}
          onChange={handleFilterChange}
        >
          <option value="">All Supervisors</option>
          {[...new Set(data.map(row => row['Assigned Supervisor']))]
            .filter(sup => sup)
            .map(sup => (
              <option key={sup} value={sup}>{sup}</option>
            ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card">
          <h2>Total Projects</h2>
          <PieChart width={300} height={200}>
            <Pie
              data={[{ name: 'Total', value: filteredData.length }]}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#00d4ff"
            />
          </PieChart>
          <p>{filteredData.length}</p>
        </div>
        <div className="card">
          <h2>Total Cost</h2>
          <p>${totalCost.toLocaleString()}</p>
        </div>
      </div>
      <div className="mt-4">
        <h2 className="text-xl">Project Costs by Supervisor</h2>
        <BarChart
          width={600}
          height={300}
          data={Object.entries(
            filteredData.reduce((acc, row) => {
              const sup = row['Assigned Supervisor'] || 'Unassigned';
              acc[sup] = (acc[sup] || 0) + (parseFloat(row['SOW Estimated Cost']) || 0);
              return acc;
            }, {})
          ).map(([sup, cost]) => ({ supervisor: sup, cost }))}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="supervisor" />
          <YAxis />
          <Bar dataKey="cost" fill="#00d4ff" />
          <Tooltip />
        </BarChart>
      </div>
      <div className="mt-4">
        <h2 className="text-xl">Projects List</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-800">
              <th>NTP Number</th>
              <th>Supervisor</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, index) => (
              <tr key={index} className="border-t border-gray-700">
                <td>{row['NTP Number']}</td>
                <td>{row['Assigned Supervisor']}</td>
                <td>${parseFloat(row['SOW Estimated Cost']).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Render the React app
const root = createRoot(document.getElementById('root'));
root.render(<CMS />);
