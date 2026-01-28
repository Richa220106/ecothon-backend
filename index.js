const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;


app.use(cors());

app.use(bodyParser.json());

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Get all segments for heatmap/visualization
app.get('/api/segments', (req, res) => {
    db.all("SELECT * FROM segments", [], (err, rows) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Calculate route cost based on multiple factors: pollution, time, distance
app.post('/api/score-routes', (req, res) => {
    const { routes, transportMode, isPeak } = req.body;

    if (!routes || !Array.isArray(routes)) {
        console.error("Invalid routes provided:", routes);
        return res.status(400).json({ error: "Invalid routes provided" });
    }

    db.all("SELECT * FROM segments", [], (err, segments) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).json({ error: err.message });
        }

        try {
            const scoredRoutes = routes.map(route => {
                let totalPollution = 0;
                let totalTime = route.totalDuration || 0;

                if (!route.roads || route.roads.length === 0) return { ...route, pollutionScore: 0, costTime: totalTime, costPollution: 0, costCombined: totalTime };

                route.roads.forEach(road => {
                    const roadCoords = road.coordinates || [];
                    if (roadCoords.length === 0) return;

                    // Match against database segments
                    const match = segments.find(s =>
                        (road.name && s.name.toLowerCase().includes(road.name.toLowerCase())) ||
                        (Math.abs(s.start_lat - roadCoords[0][0]) < 0.005 && Math.abs(s.start_lng - roadCoords[0][1]) < 0.005)
                    );

                    let segmentPollution = 50;
                    if (match) {
                        const base = match.base_pollution * (isPeak ? 1.6 : 1.0);
                        const traffic = match.traffic_density * (transportMode === 'CAR' ? 1.3 : 0.7);
                        segmentPollution = base * traffic;
                    } else {
                        // Dynamic fallback based on road type if no DB match
                        segmentPollution = road.type === 'Main Road' ? 70 : 35;
                        if (isPeak) segmentPollution *= 1.4;
                    }

                    totalPollution += (segmentPollution * (parseFloat(road.length) || 0.1));
                });

                // User requested weights:
                // Fastest -> weight = time
                // Cleanest -> weight = pollution
                // Average -> weight = (time + pollution)/2

                // We normalize pollution to be roughly on the same scale as time (seconds) for the average
                // Typically a journey is 20-40 mins (1200-2400s) and pollution is 100-300 units.
                // Scale factor ~ 8
                const normalizedPollution = totalPollution * 8;

                return {
                    ...route,
                    pollutionScore: parseFloat(totalPollution.toFixed(2)),
                    timeScore: totalTime,
                    // Costs for selection
                    costTime: totalTime,
                    costPollution: totalPollution,
                    costCombined: (totalTime + normalizedPollution) / 2
                };
            });

            res.json(scoredRoutes);
        } catch (err) {
            console.error("Scoring error:", err);
            res.status(500).json({ error: "Internal scoring error" });
        }

    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


