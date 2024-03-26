const express = require('express');
// const fetch = require('node-fetch');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Define endpoint for fetching filtered responses
app.get('/:formId/filteredResponses', async (req, res) => {
    try {
        const formId = req.params.formId;
        const filters = JSON.parse(req.query.filters);
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const pageSize = parseInt(req.query.pageSize) || 10; // Default to 10 responses per page

        // Fetch responses from Fillout.com API
        const apiKey = 'sk_prod_TfMbARhdgues5AuIosvvdAC9WsA5kXiZlW8HZPaRDlIbCpSpLsXBeZO7dCVZQwHAY3P4VSBPiiC33poZ1tdUj2ljOzdTCCOSpUZ_3912';
        const filloutApiUrl = `https://api.fillout.com/v1/api/forms/${formId}/submissions`;
        const myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer " + apiKey);

        const requestOptions = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow"
        };

        const response = await fetch(filloutApiUrl, requestOptions);
        const responseData = await response.json();

        // Filter responses based on provided filters
        const filteredResponses = responseData.responses.filter(response => {
            return filters.every(filter => {
                const question = response.questions.find(q => q.id === filter.id);
                if (!question) return false;

                switch (filter.condition) {
                    case 'equals':
                        return question.value === filter.value;
                    case 'does_not_equal':
                        return question.value !== filter.value;
                    case 'greater_than':
                        return new Date(question.value) > new Date(filter.value);
                    case 'less_than':
                        return new Date(question.value) < new Date(filter.value);
                    default:
                        return false;
                }
            });
        });

        // Implement pagination
        const totalResponses = filteredResponses.length;
        const totalPages = Math.ceil(totalResponses / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalResponses);
        const paginatedResponses = filteredResponses.slice(startIndex, endIndex);

        // Prepare response with filtered responses and pagination information
        res.json({
            responses: paginatedResponses,
            totalResponses,
            pageCount: totalPages,
            currentPage: page
        });
    } catch (error) {
        console.error('Error fetching or filtering responses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
