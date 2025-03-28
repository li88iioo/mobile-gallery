module.exports = {
  plugins: [
    require('cssnano')({
      preset: [
        'default',
        {
          discardComments: {
            removeAll: true,
          },
          normalizeWhitespace: true,
          cssDeclarationSorter: true,
          calc: true,
          colormin: true,
          convertValues: true,
          discardEmpty: true,
          discardOverridden: true,
          mergeIdents: false,
          reduceIdents: false,
          reduceInitial: true,
          svgo: true,
          minifyFontValues: true,
          minifySelectors: true,
          normalizeCharset: true,
          normalizeDisplayValues: true,
          normalizePositions: true,
          normalizeRepeatStyle: true,
          normalizeString: true,
          normalizeTimingFunctions: true,
          normalizeUnicode: true,
          normalizeUrl: true,
          orderedValues: true,
          reduceTransforms: true,
          uniqueSelectors: true,
          // 禁用源映射
          map: false
        },
      ],
    }),
  ],
} 