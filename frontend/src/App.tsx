import { ExpenseList } from './components/ExpenseList';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          Expense Tracker
        </h1>
        <ExpenseList />
      </div>
    </div>
  );
}

export default App;
