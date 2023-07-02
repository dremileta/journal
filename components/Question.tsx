'use client';

import { askQuestion } from '@/utils/api';
import { ChangeEvent, FormEvent, useState } from 'react';

const Question = () => {
  const [value, setvalue] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const onChange = (e: ChangeEvent) => {};

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);
    const answer = await askQuestion(value);

    setResponse(answer);
    setvalue('');
    setLoading(false);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          disabled={loading}
          placeholder="Ask a question"
          value={value}
          onChange={onChange}
          className="border border-black/20 px-4 py-2 text-lg rounded-lg"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-400 px-4 py-2 rounded-lg text-lg"
        >
          Ask
        </button>
      </form>
      {loading && <div>...loading</div>}
      {response && <div>{response}</div>}
    </div>
  );
};

export default Question;
