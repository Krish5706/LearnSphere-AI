import React from 'react';
import { Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Code, Quote, Undo, Redo, Pilcrow, CaseSensitive, Palette, Indent, Outdent, Eraser } from 'lucide-react';
import './Toolbar.css';

const Toolbar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="toolbar-container">
      {/* Style & Font Controls */}
      <div className="toolbar-group">
        <select onChange={(e) => {
          const value = e.target.value;
          if (value === 'p') editor.chain().focus().setParagraph().run();
          if (value.startsWith('h')) editor.chain().focus().toggleHeading({ level: parseInt(value.charAt(1)) }).run();
          if (value === 'blockquote') editor.chain().focus().toggleBlockquote().run();
          if (value === 'codeBlock') editor.chain().focus().toggleCodeBlock().run();
        }} className="toolbar-select">
          <option value="p">Normal Text</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote</option>
          <option value="codeBlock">Code Block</option>
        </select>

        <select onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()} className="toolbar-select">
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Calibri">Calibri</option>
          <option value="Georgia">Georgia</option>
          <option value="Courier New">Courier New</option>
        </select>

        <select onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()} className="toolbar-select">
          <option value="12">12</option>
          <option value="14">14</option>
          <option value="16">16</option>
          <option value="18">18</option>
          <option value="24">24</option>
          <option value="32">32</option>
        </select>
      </div>

      {/* Text Formatting */}
      <div className="toolbar-group">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}><Bold size={16} /></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}><Italic size={16} /></button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''}><Underline size={16} /></button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''}><Strikethrough size={16} /></button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}><List size={16} /></button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''}><ListOrdered size={16} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}><AlignLeft size={16} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}><AlignCenter size={16} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}><AlignRight size={16} /></button>
      </div>

      {/* Code, Quote & Highlight */}
      <div className="toolbar-group">
        <button onClick={() => editor.chain().focus().toggleCode().run()} className={editor.isActive('code') ? 'is-active' : ''}><Code size={16} /></button>
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''}><Quote size={16} /></button>
        <input type="color" onInput={(e) => editor.chain().focus().setColor(e.target.value).run()} value={editor.getAttributes('textStyle')?.color || '#000000'} className="toolbar-color-input" />
        <input type="color" onInput={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()} value={editor.getAttributes('highlight')?.color || '#ffffff'} className="toolbar-color-input" />
      </div>

      {/* Editing & Layout */}
      <div className="toolbar-group">
        <button onClick={() => editor.chain().focus().undo().run()}><Undo size={16} /></button>
        <button onClick={() => editor.chain().focus().redo().run()}><Redo size={16} /></button>
        <button onClick={() => editor.chain().focus().unsetAllMarks().run()}><Eraser size={16} /></button>
        <button onClick={() => editor.chain().focus().sink().run()}><Indent size={16} /></button>
        <button onClick={() => editor.chain().focus().lift().run()}><Outdent size={16} /></button>
        <select onChange={(e) => editor.chain().focus().setLineHeight(e.target.value).run()} className="toolbar-select">
          <option value="1.0">1.0</option>
          <option value="1.5">1.5</option>
          <option value="2.0">2.0</option>
        </select>
      </div>
    </div>
  );
};

export default Toolbar;
