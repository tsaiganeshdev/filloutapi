const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

app.get('/', (req, res) => {
    return res.render("Yes, I am working!, Pass the params and i shall show you the filtered results");
})

// Endpoint to fetch filtered responses
app.get('/:formId/filteredResponses', async (req, res) => {
    try {
        const formId = req.params.formId;
        const apiKey = 'sk_prod_TfMbARhdgues5AuIosvvdAC9WsA5kXiZlW8HZPaRDlIbCpSpLsXBeZO7dCVZQwHAY3P4VSBPiiC33poZ1tdUj2ljOzdTCCOSpUZ_3912'; // Replace with your actual API key

        console.log("filters", req.query.filters)

        // Parsing filters from query parameters
        const filters = JSON.parse(req.query.filters);

        // Fetching responses from Fillout.com's API
        const response = await axios.get(`https://api.fillout.com/v1/api/forms/${formId}/submissions`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        // Applying filters to responses
        const filteredResponses = response.data.responses.filter(response => {
            for (const filter of filters) {
                const question = response.questions.find(question => question.id === filter.id);
                if (!question) return false;

                switch (filter.condition) {
                    case 'equals':
                        if (question.value !== filter.value) return false;
                        break;
                    case 'does_not_equal':
                        if (question.value === filter.value) return false;
                        break;
                    case 'greater_than':
                        if (!(new Date(question.value) > new Date(filter.value))) return false;
                        break;
                    case 'less_than':
                        if (!(new Date(question.value) < new Date(filter.value))) return false;
                        break;
                    default:
                        return false;
                }
            }
            return true;
        });

        res.json({
            responses: filteredResponses,
            totalResponses: filteredResponses.length,
            pageCount: 1 // Assuming no pagination required for this assignment
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Starting the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
