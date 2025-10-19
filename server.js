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

Extract the top ${limit} customers by sales amount.

Return ONLY a valid JSON array with NO other text before or after:
[{"name":"Customer Name","sales":123456.78},{"name":"Customer 2","sales":98765.43}]

CRITICAL RULES:
- Start response with [ 
- End response with ]
- No markdown code blocks
- No explanatory text
- No newlines between array elements
- Pure JSON array only`
      }]
    });
    
    let responseText = message.content[0].text.trim();
    
    // Remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Extract just the JSON array
    const arrayMatch = responseText.match(/\[[\s\S]*?\]/);
    
    if (!arrayMatch) {
      throw new Error('No valid JSON array found in response');
    }
    
    const customers = JSON.parse(arrayMatch[0]);
    
    res.json({
      success: true,
      period: `${year}-${month}`,
      count: customers.length,
      customers: customers
    });
    
  } catch (error) {
    console.error('Error:', error.message);
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
```

---

## Deploy the Fix:

1. **Update the file on GitHub:**
   - Go to your repo: `https://github.com/YOUR_USERNAME/netsuite-api`
   - Click `server.js`
   - Click pencil icon (Edit)
   - Replace all content with the code above
   - Click "Commit changes"

2. **Vercel will auto-deploy** (takes ~1 minute)

3. **Test again:**
```
   https://netsuite-api-abc.vercel.app/api/customers/top/2025/9?limit=5