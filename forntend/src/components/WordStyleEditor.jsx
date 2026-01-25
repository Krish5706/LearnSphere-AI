  import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { FontSize } from '../extensions/font-size';
import { LineHeight } from '../extensions/LineHeight';
import Toolbar from './Toolbar';
import './Editor.css'; // Re-use the base editor styles

const WordStyleEditor = ({ content, onChange, onEditorReady, hideToolbar }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: true, // Enable history for undo/redo
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'prose-code-block',
          },
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({ multicolor: true }),
      FontFamily,
      TextStyle,
      Color,
      FontSize,
      LineHeight.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: content,
    onCreate: ({ editor }) => {
      if (onEditorReady) onEditorReady(editor);
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose',
      },
    },
  });

  // Update editor content when the content prop changes (e.g., switching notes)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className={`editor-container ${hideToolbar ? '!border-0 !shadow-none !rounded-none' : ''}`}>
      {!hideToolbar && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
};

export default WordStyleEditor;
