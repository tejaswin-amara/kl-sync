import { processAIChat } from '../../src/lib/ai/executor';

async function runEmpiricalTests() {
  console.log('--- Testing processAIChat ---');

  const queries = [
    'What is my attendance in OS?',
    'Show my timetable for tomorrow',
    'How much fee do I owe?',
    'What are my marks?',
    'Who am I?',
    'How many classes do I need to attend for 75%?',
    'Predict my CGPA if I get A in 4 credit course',
    'Random unknown query text'
  ];

  for (const q of queries) {
    try {
      const res = await processAIChat([{ role: 'user', content: q }]);
      console.log(`\nQuery: "${q}"`);
      console.log(`Tool calls count: ${res.toolCalls.length}`);
      if (res.toolCalls.length > 0) {
        console.log(`Tool: ${res.toolCalls[0].tool}`);
        console.log(`Args: ${JSON.stringify(res.toolCalls[0].args)}`);
      }
      console.log(`Response length: ${res.assistantResponseText.length}`);
      console.log(`Snippet: ${res.assistantResponseText.slice(0, 100).replace(/\n/g, ' ')}...`);
    } catch (err) {
      console.error(`Query "${q}" threw error:`, err);
    }
  }
}

runEmpiricalTests();
