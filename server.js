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
        content: `Use ns_runReport tool with report ID 272 for date range ${startDateStr} to ${endDateStr}. Return top ${limit} customers by sales as JSON array: [{"name":"Customer","sales":12345}]`
      }]
    });
    
    let responseText = message.content[0].text.trim();
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const arrayMatch = responseText.match(/\[[\s\S]*?\]/);
    
    if (!arrayMatch) {
      return res.json({
        success: false,
        error: 'Could not parse response',
        rawResponse: responseText.substring(0, 200)
      });
    }
    
    const customers = JSON.parse(arrayMatch[0]);
    
    res.json({
      success: true,
      period: `${year}-${month}`,
      count: customers.length,
      customers: customers
    });
    
  } catch (error) {
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
