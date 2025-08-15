import {
  ShareViewOptions,
  defaultShareViewOptions,
  parseShareViewOptionsFromUrl,
  serializeShareViewOptionsToQuery,
  applyShareViewOptionsPrecedence,
  mergeShareViewOptionsFromUrl,
} from '@/utils/urlEncoding';

describe('ShareViewOptions URL encoding/decoding', () => {
  describe('parseShareViewOptionsFromUrl', () => {
    it('should return defaults when no parameters are provided', () => {
      const result = parseShareViewOptionsFromUrl('');
      expect(result).toEqual(defaultShareViewOptions);
    });

    it('should return defaults when only empty search string is provided', () => {
      const result = parseShareViewOptionsFromUrl('?');
      expect(result).toEqual(defaultShareViewOptions);
    });

    it('should parse layout parameter correctly', () => {
      const result = parseShareViewOptionsFromUrl('?layout=noninteractive');
      expect(result.layout).toBe('noninteractive');
      expect(result.funcOnly).toBe(defaultShareViewOptions.funcOnly);
    });

    it('should fall back to default layout for invalid values', () => {
      const result = parseShareViewOptionsFromUrl('?layout=invalid');
      expect(result.layout).toBe(defaultShareViewOptions.layout);
    });

    it('should parse boolean parameters correctly', () => {
      const result = parseShareViewOptionsFromUrl('?funcOnly=1&fullscreen=0&tools=1&zoom=0&unitCtl=1');
      expect(result.funcOnly).toBe(true);
      expect(result.fullscreen).toBe(false);
      expect(result.tools).toBe(true);
      expect(result.zoom).toBe(false);
      expect(result.unitCtl).toBe(true);
    });

    it('should fall back to defaults for invalid boolean values', () => {
      const result = parseShareViewOptionsFromUrl('?funcOnly=invalid&tools=maybe');
      expect(result.funcOnly).toBe(defaultShareViewOptions.funcOnly);
      expect(result.tools).toBe(defaultShareViewOptions.tools);
    });

    it('should parse valid language codes', () => {
      const result1 = parseShareViewOptionsFromUrl('?lang=de');
      expect(result1.lang).toBe('de');

      const result2 = parseShareViewOptionsFromUrl('?lang=en-US');
      expect(result2.lang).toBe('en-US');
    });

    it('should fall back to default language for invalid codes', () => {
      const result1 = parseShareViewOptionsFromUrl('?lang=invalid');
      expect(result1.lang).toBe(defaultShareViewOptions.lang);

      const result2 = parseShareViewOptionsFromUrl('?lang=toolong');
      expect(result2.lang).toBe(defaultShareViewOptions.lang);

      const result3 = parseShareViewOptionsFromUrl('?lang=123');
      expect(result3.lang).toBe(defaultShareViewOptions.lang);
    });

    it('should parse complex parameter combinations', () => {
      const result = parseShareViewOptionsFromUrl(
        '?layout=noninteractive&funcOnly=1&fullscreen=1&tools=0&zoom=0&unitCtl=0&lang=de'
      );
      expect(result).toEqual({
        layout: 'noninteractive',
        funcOnly: true,
        fullscreen: true,
        tools: false,
        zoom: false,
        unitCtl: false,
        lang: 'de',
      });
    });
  });

  describe('serializeShareViewOptionsToQuery', () => {
    it('should return empty string for default options', () => {
      const result = serializeShareViewOptionsToQuery(defaultShareViewOptions);
      expect(result).toBe('');
    });

    it('should serialize non-default layout', () => {
      const options: ShareViewOptions = {
        ...defaultShareViewOptions,
        layout: 'noninteractive',
      };
      const result = serializeShareViewOptionsToQuery(options);
      expect(result).toBe('layout=noninteractive');
    });

    it('should serialize boolean parameters as 0 or 1', () => {
      const options: ShareViewOptions = {
        ...defaultShareViewOptions,
        funcOnly: true,
        tools: false,
      };
      const result = serializeShareViewOptionsToQuery(options);
      expect(result).toBe('funcOnly=1&tools=0');
    });

    it('should serialize language parameter', () => {
      const options: ShareViewOptions = {
        ...defaultShareViewOptions,
        lang: 'de',
      };
      const result = serializeShareViewOptionsToQuery(options);
      expect(result).toBe('lang=de');
    });

    it('should maintain consistent parameter ordering', () => {
      const options: ShareViewOptions = {
        layout: 'noninteractive',
        funcOnly: true,
        fullscreen: true,
        tools: false,
        zoom: false,
        unitCtl: false,
        lang: 'de',
      };
      const result = serializeShareViewOptionsToQuery(options);
      expect(result).toBe('layout=noninteractive&funcOnly=1&fullscreen=1&tools=0&zoom=0&unitCtl=0&lang=de');
    });

    it('should omit parameters that match defaults', () => {
      const options: ShareViewOptions = {
        ...defaultShareViewOptions,
        funcOnly: true, // non-default
        tools: true, // default, should be omitted
        lang: 'de', // non-default
      };
      const result = serializeShareViewOptionsToQuery(options);
      expect(result).toBe('funcOnly=1&lang=de');
    });
  });

  describe('round-trip parse/serialize', () => {
    it('should maintain data integrity through parse/serialize cycle', () => {
      const originalOptions: ShareViewOptions = {
        layout: 'noninteractive',
        funcOnly: true,
        fullscreen: false,
        tools: false,
        zoom: true,
        unitCtl: false,
        lang: 'de',
      };

      const serialized = serializeShareViewOptionsToQuery(originalOptions);
      const parsed = parseShareViewOptionsFromUrl('?' + serialized);

      expect(parsed).toEqual(originalOptions);
    });

    it('should handle default options round-trip', () => {
      const serialized = serializeShareViewOptionsToQuery(defaultShareViewOptions);
      const parsed = parseShareViewOptionsFromUrl('?' + serialized);

      expect(parsed).toEqual(defaultShareViewOptions);
    });

    it('should handle partial options round-trip', () => {
      const partialOptions: ShareViewOptions = {
        ...defaultShareViewOptions,
        layout: 'noninteractive',
        lang: 'fr',
      };

      const serialized = serializeShareViewOptionsToQuery(partialOptions);
      const parsed = parseShareViewOptionsFromUrl('?' + serialized);

      expect(parsed).toEqual(partialOptions);
    });
  });

  describe('applyShareViewOptionsPrecedence', () => {
    it('should return options unchanged for default layout when funcOnly is false', () => {
      const options: ShareViewOptions = {
        layout: 'default',
        funcOnly: true,
        fullscreen: true,
        tools: true,
        zoom: true,
        unitCtl: true,
        lang: 'en',
      };

      const result = applyShareViewOptionsPrecedence({ ...options, funcOnly: false });
      expect(result).toEqual({ ...options, funcOnly: false });
    });

    it('should hide all UI controls when layout is noninteractive', () => {
      const options: ShareViewOptions = {
        layout: 'noninteractive',
        funcOnly: true,
        fullscreen: true,
        tools: true,
        zoom: true,
        unitCtl: true,
        lang: 'en',
      };

      const result = applyShareViewOptionsPrecedence(options);
      expect(result).toEqual({
        ...options,
        tools: false,
        zoom: false,
        unitCtl: false,
        fullscreen: false,
      });
    });

    it('should hide tools when funcOnly is true and layout is default', () => {
      const options: ShareViewOptions = {
        layout: 'default',
        funcOnly: true,
        fullscreen: true,
        tools: true,
        zoom: true,
        unitCtl: true,
        lang: 'en',
      };

      const result = applyShareViewOptionsPrecedence(options);
      expect(result).toEqual({
        ...options,
        tools: false,
      });
    });
  });

  describe('mergeShareViewOptionsFromUrl', () => {
    it('should preserve existing options when no URL parameters are provided', () => {
      const existingOptions: ShareViewOptions = {
        layout: 'noninteractive',
        funcOnly: true,
        fullscreen: true,
        tools: false,
        zoom: false,
        unitCtl: false,
        lang: 'de',
      };

      const result = mergeShareViewOptionsFromUrl(existingOptions, '');
      expect(result).toEqual(existingOptions);
    });

    it('should override only parameters present in URL', () => {
      const existingOptions: ShareViewOptions = {
        layout: 'default',
        funcOnly: false,
        fullscreen: false,
        tools: true,
        zoom: true,
        unitCtl: true,
        lang: 'en',
      };

      const result = mergeShareViewOptionsFromUrl(existingOptions, '?layout=noninteractive&lang=de');
      
      expect(result).toEqual({
        layout: 'noninteractive', // overridden
        funcOnly: false, // preserved
        fullscreen: false, // preserved
        tools: true, // preserved
        zoom: true, // preserved
        unitCtl: true, // preserved
        lang: 'de', // overridden
      });
    });

    it('should handle partial boolean overrides', () => {
      const existingOptions: ShareViewOptions = {
        layout: 'default',
        funcOnly: true,
        fullscreen: true,
        tools: false,
        zoom: false,
        unitCtl: false,
        lang: 'de',
      };

      const result = mergeShareViewOptionsFromUrl(existingOptions, '?funcOnly=0&tools=1');
      
      expect(result).toEqual({
        layout: 'default', // preserved
        funcOnly: false, // overridden
        fullscreen: true, // preserved
        tools: true, // overridden
        zoom: false, // preserved
        unitCtl: false, // preserved
        lang: 'de', // preserved
      });
    });
  });

  describe('edge cases and validation', () => {
    it('should handle malformed URL search strings', () => {
      const result1 = parseShareViewOptionsFromUrl('?layout=');
      expect(result1.layout).toBe(defaultShareViewOptions.layout);

      const result2 = parseShareViewOptionsFromUrl('?=noninteractive');
      expect(result2).toEqual(defaultShareViewOptions);

      const result3 = parseShareViewOptionsFromUrl('?layout=noninteractive&');
      expect(result3.layout).toBe('noninteractive');
    });

    it('should handle URL encoding in parameters', () => {
      const result = parseShareViewOptionsFromUrl('?lang=en%2DUS');
      // URL encoded en-US should be decoded
      expect(result.lang).toBe('en-US');
    });

    it('should handle duplicate parameters (URLSearchParams behavior)', () => {
      // URLSearchParams.get() uses the first value for duplicate keys
      const result = parseShareViewOptionsFromUrl('?layout=default&layout=noninteractive');
      expect(result.layout).toBe('default');
    });

    it('should handle case sensitivity correctly', () => {
      const result = parseShareViewOptionsFromUrl('?layout=Noninteractive&lang=DE');
      // Should fall back to defaults due to case mismatch
      expect(result.layout).toBe(defaultShareViewOptions.layout);
      expect(result.lang).toBe(defaultShareViewOptions.lang);
    });
  });
});