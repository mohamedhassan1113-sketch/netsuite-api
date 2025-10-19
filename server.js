// NetSuite Backend API - server.js
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3001;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/customers/top/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const limit = parseInt(req.query.limit) || 5;
    
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: `Use ns_runReport tool (report ID 272 - Sales by Customer Summary) for ${startDateStr} to ${endDateStr}.

Return ONLY a JSON array of the top ${limit} customers by sales:
[
  {"name": "Customer Name", "sales": 123456.78},
  ...
]

Response must be valid JSON only, no markdown or explanatory text.`
      }]
    });
    
    const responseText = message.content[0].text.trim();
    const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let customers;
    try {
      customers = JSON.parse(cleanedText);
    } catch (parseError) {
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        customers = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse customer data');
      }
    }
    
    res.json({
      success: true,
      period: `${year}-${month}`,
      count: customers.length,
      customers: customers
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;