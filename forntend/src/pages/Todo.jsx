import React from 'react';
import TodoList from '../components/todo/TodoList';

const Todo = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <TodoList />
            </div>
        </div>
    );
};

export default Todo;
