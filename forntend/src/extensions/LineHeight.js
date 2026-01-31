import { Extension } from '@tiptap/core';

export const LineHeight = Extension.create({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      defaultLineHeight: '1.0',
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: this.options.defaultLineHeight,
            parseHTML: element => element.style.lineHeight || this.options.defaultLineHeight,
            renderHTML: attributes => {
              if (!attributes.lineHeight) return {};
              return { style: `line-height: ${attributes.lineHeight}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight: (lineHeight) => ({ commands }) => {
        let applied = false;
        this.options.types.forEach(type => {
          if (commands.updateAttributes(type, { lineHeight })) {
            applied = true;
          }
        });
        return applied;
      },
      unsetLineHeight: () => ({ commands }) => {
        let applied = false;
        this.options.types.forEach(type => {
          if (commands.resetAttributes(type, 'lineHeight')) {
            applied = true;
          }
        });
        return applied;
      },
    };
  },
});