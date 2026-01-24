import { Extension } from '@tiptap/core';
import '@tiptap/extension-text-style';

// Helper function to get the current font size from the selection
const getCurrentFontSize = (editor, sizes, defaultSize) => {
  for (const size of sizes) {
    if (editor.isActive('textStyle', { fontSize: size })) {
      return size;
    }
  }
  return editor.getAttributes('textStyle').fontSize || defaultSize;
};

export const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      sizes: ['12px', '14px', '16px', '18px', '24px', '32px'],
      defaultSize: '16px',
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize: (fontSize) => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).run();
      },
      increaseFontSize: () => ({ editor, chain }) => {
        const currentSize = getCurrentFontSize(editor, this.options.sizes, this.options.defaultSize);
        const currentIndex = this.options.sizes.indexOf(currentSize);
        const nextIndex = (currentIndex + 1) % this.options.sizes.length;
        const nextSize = this.options.sizes[nextIndex];
        return chain().setFontSize(nextSize).run();
      },
      decreaseFontSize: () => ({ editor, chain }) => {
        const currentSize = getCurrentFontSize(editor, this.options.sizes, this.options.defaultSize);
        const currentIndex = this.options.sizes.indexOf(currentSize);
        const prevIndex = (currentIndex - 1 + this.options.sizes.length) % this.options.sizes.length;
        const prevSize = this.options.sizes[prevIndex];
        return chain().setFontSize(prevSize).run();
      },
    };
  },
});
