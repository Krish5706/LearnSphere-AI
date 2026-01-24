import React from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight, 
  Code, CodeSquare, Quote, 
  Highlighter, Palette,
  Undo, Redo, Eraser, 
  Indent, Outdent,
  Type
} from 'lucide-react';
import './Toolbar.css';

const Toolbar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const isInCodeBlock = editor.isActive('codeBlock');
  const currentFontSizeValue = editor.getAttributes('textStyle')?.fontSize || '16px';
  const currentFontSize = currentFontSizeValue.replace('px', '');
  const currentFontFamily = editor.getAttributes('textStyle')?.fontFamily || 'Arial';

  const handleStyleChange = (style) => {
    switch(style) {
      case 'p':
        editor.chain().focus().clearNodes().setParagraph().run();
        break;
      case 'h1':
        editor.chain().focus().clearNodes().toggleHeading({ level: 1 }).run();
        break;
      case 'h2':
        editor.chain().focus().clearNodes().toggleHeading({ level: 2 }).run();
        break;
      case 'h3':
        editor.chain().focus().clearNodes().toggleHeading({ level: 3 }).run();
        break;
      case 'blockquote':
        editor.chain().focus().clearNodes().toggleBlockquote().run();
        break;
      case 'codeBlock':
        editor.chain().focus().clearNodes().toggleCodeBlock().run();
        break;
      default:
        break;
    }
  };

  const getCurrentStyle = () => {
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    if (editor.isActive('blockquote')) return 'blockquote';
    if (editor.isActive('codeBlock')) return 'codeBlock';
    return 'p';
  };

  const handleFontSizeChange = (size) => {
    editor.chain().focus().setFontSize(`${size}px`).run();
  };

  const handleFontFamilyChange = (family) => {
    editor.chain().focus().setFontFamily(family).run();
  };

  return (
    <div className="toolbar-container">
      
      {/* 1. TEXT STYLE & FONT CONTROLS (LEFT SECTION) */}
      <div className="toolbar-section">
        <div className="toolbar-label">Style</div>
        <select 
          value={getCurrentStyle()}
          onChange={(e) => handleStyleChange(e.target.value)}
          className="toolbar-select"
          title="Text Style"
        >
          <option value="p">Normal Text</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote</option>
          <option value="codeBlock">Code Block</option>
        </select>
      </div>

      {/* FONT FAMILY SELECTOR */}
      <div className="toolbar-section">
        <div className="toolbar-label">Font</div>
        <select 
          value={currentFontFamily}
          onChange={(e) => handleFontFamilyChange(e.target.value)}
          className="toolbar-select"
          title="Font Family"
        >
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Calibri">Calibri</option>
          <option value="Georgia">Georgia</option>
          <option value="Courier New">Courier New</option>
        </select>
      </div>

      {/* FONT SIZE SELECTOR */}
      <div className="toolbar-section">
        <div className="toolbar-label">Size</div>
        <select 
          value={currentFontSize}
          onChange={(e) => handleFontSizeChange(e.target.value)}
          className="toolbar-select"
          title="Font Size"
        >
          <option value="10">10</option>
          <option value="12">12</option>
          <option value="14">14</option>
          <option value="16">16</option>
          <option value="18">18</option>
          <option value="24">24</option>
          <option value="32">32</option>
        </select>
      </div>

      {/* 2. TEXT FORMATTING ICONS (CENTER SECTION) */}
      <div className="toolbar-section">
        <div className="toolbar-label">Format</div>
        <div className="toolbar-group">
          <button 
            onClick={() => editor.chain().focus().toggleBold().run()} 
            className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
            title="Bold (Ctrl+B)"
          >
            <Bold size={18} />
          </button>
          <button 
            onClick={() => editor.chain().focus().toggleItalic().run()} 
            className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
            title="Italic (Ctrl+I)"
          >
            <Italic size={18} />
          </button>
          <button 
            onClick={() => editor.chain().focus().toggleUnderline().run()} 
            className={`toolbar-btn ${editor.isActive('underline') ? 'is-active' : ''}`}
            title="Underline (Ctrl+U)"
          >
            <Underline size={18} />
          </button>
          <button 
            onClick={() => editor.chain().focus().toggleStrike().run()} 
            className={`toolbar-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
            title="Strikethrough"
          >
            <Strikethrough size={18} />
          </button>
        </div>
      </div>

      {/* LISTS */}
      <div className="toolbar-section">
        <div className="toolbar-label">Lists</div>
        <div className="toolbar-group">
          <button 
            onClick={() => editor.chain().focus().toggleBulletList().run()} 
            className={`toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
            title="Bullet List"
          >
            <List size={18} />
          </button>
          <button 
            onClick={() => editor.chain().focus().toggleOrderedList().run()} 
            className={`toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
            title="Numbered List"
          >
            <ListOrdered size={18} />
          </button>
        </div>
      </div>

      {/* ALIGNMENT SECTION */}
      <div className="toolbar-section">
        <div className="toolbar-label">Align</div>
        <div className="toolbar-group">
          <button 
            onClick={() => editor.chain().focus().setTextAlign('left').run()} 
            className={`toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`}
            title="Align Left"
          >
            <AlignLeft size={18} />
          </button>
          <button 
            onClick={() => editor.chain().focus().setTextAlign('center').run()} 
            className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`}
            title="Align Center"
          >
            <AlignCenter size={18} />
          </button>
          <button 
            onClick={() => editor.chain().focus().setTextAlign('right').run()} 
            className={`toolbar-btn ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`}
            title="Align Right"
          >
            <AlignRight size={18} />
          </button>
        </div>
      </div>

      {/* 3. CODE, QUOTE & HIGHLIGHT TOOLS (RIGHT SECTION) */}
      <div className="toolbar-section">
        <div className="toolbar-label">Tools</div>
        <div className="toolbar-group">
          <button 
            onClick={() => editor.chain().focus().toggleCode().run()} 
            className={`toolbar-btn ${editor.isActive('code') ? 'is-active' : ''}`}
            title="Inline Code"
          >
            <Code size={18} />
          </button>
          <button 
            onClick={() => editor.chain().focus().toggleCodeBlock().run()} 
            className={`toolbar-btn ${editor.isActive('codeBlock') ? 'is-active' : ''}`}
            title="Code Block"
          >
            <CodeSquare size={18} />
          </button>
          <button 
            onClick={() => editor.chain().focus().toggleBlockquote().run()} 
            className={`toolbar-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
            title="Block Quote"
          >
            <Quote size={18} />
          </button>
        </div>
      </div>

      {/* HIGHLIGHT & COLOR - Disabled in Code Block */}
      <div className="toolbar-section">
        <div className="toolbar-label">Color</div>
        <div className="toolbar-group">
          <button 
            onClick={() => editor.chain().focus().toggleHighlight({ color: '#fccf10' }).run()} 
            className={`toolbar-btn ${editor.isActive('highlight') ? 'is-active' : ''}`}
            title="Highlight Text"
            disabled={isInCodeBlock}
          >
            <Highlighter size={18} />
          </button>
          <input 
            type="color" 
            onInput={(e) => editor.chain().focus().setColor(e.target.value).run()} 
            value={editor.getAttributes('textStyle')?.color || '#000000'} 
            className="toolbar-color-input"
            title="Text Color"
            disabled={isInCodeBlock}
          />
          <input 
            type="color" 
            onInput={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()} 
            value={editor.getAttributes('highlight')?.color || '#fccf10'} 
            className="toolbar-color-input"
            title="Background Highlight"
            disabled={isInCodeBlock}
          />
        </div>
      </div>

      {/* 4. EDITING & LAYOUT CONTROLS (FAR RIGHT) */}
      <div className="toolbar-section">
        <div className="toolbar-label">Edit</div>
        <div className="toolbar-group">
          <button 
            onClick={() => editor.chain().focus().undo().run()} 
            className="toolbar-btn"
            title="Undo (Ctrl+Z)"
          >
            <Undo size={18} />
          </button>
          <button 
            onClick={() => editor.chain().focus().redo().run()} 
            className="toolbar-btn"
            title="Redo (Ctrl+Y)"
          >
            <Redo size={18} />
          </button>
          <button 
            onClick={() => editor.chain().focus().unsetAllMarks().run()} 
            className="toolbar-btn"
            title="Clear Formatting"
          >
            <Eraser size={18} />
          </button>
        </div>
      </div>

      {/* INDENTATION */}
      <div className="toolbar-section">
        <div className="toolbar-label">Indent</div>
        <div className="toolbar-group">
          <button 
            onClick={() => editor.chain().focus().sinkListItem('listItem').run()} 
            className="toolbar-btn"
            title="Increase Indent"
            disabled={!editor.can().sinkListItem('listItem')}
          >
            <Indent size={18} />
          </button>
          <button 
            onClick={() => editor.chain().focus().liftListItem('listItem').run()} 
            className="toolbar-btn"
            title="Decrease Indent"
            disabled={!editor.can().liftListItem('listItem')}
          >
            <Outdent size={18} />
          </button>
        </div>
      </div>

      {/* LINE SPACING */}
      <div className="toolbar-section">
        <div className="toolbar-label">Space</div>
        <select 
          onChange={(e) => editor.chain().focus().setLineHeight(e.target.value).run()} 
          className="toolbar-select"
          title="Line Height"
        >
          <option value="1.0">1.0</option>
          <option value="1.5">1.5</option>
          <option value="2.0">2.0</option>
        </select>
      </div>

    </div>
  );
};

export default Toolbar;
