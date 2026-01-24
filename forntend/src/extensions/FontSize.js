import { Extension } from '@tiptap/core';
import '@tiptap/extension-text-style';

export const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => {
              const fontSize = element.style.fontSize;
              if (!fontSize) return null;
              return fontSize.replace('px', '');
            },
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              const size = attributes.fontSize.endsWith('px') ? attributes.fontSize : `${attributes.fontSize}px`;
              return { style: `font-size: ${size}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize: (fontSize) => ({ commands }) => {
        const size = fontSize.endsWith('px') ? fontSize : `${fontSize}px`;
        return commands.setMark('textStyle', { fontSize: size });
      },
      unsetFontSize: () => ({ commands }) => {
        return commands.updateAttributes('textStyle', { fontSize: null });
      },
    };
  },
});
