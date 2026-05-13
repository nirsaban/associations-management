import { describe, it, expect } from 'vitest';
import { parseCsv, csvToRecords } from './csv';

describe('parseCsv', () => {
  it('parses simple rows', () => {
    expect(parseCsv('a,b\n1,2\n3,4')).toEqual([['a', 'b'], ['1', '2'], ['3', '4']]);
  });
  it('handles quoted commas', () => {
    expect(parseCsv('a,b\n"x,y",z')).toEqual([['a', 'b'], ['x,y', 'z']]);
  });
  it('handles escaped quotes', () => {
    expect(parseCsv('a\n"he said ""hi"""')).toEqual([['a'], ['he said "hi"']]);
  });
  it('handles CRLF', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([['a', 'b'], ['1', '2']]);
  });
  it('skips empty rows', () => {
    expect(parseCsv('a\n\n1\n')).toEqual([['a'], ['1']]);
  });
});

describe('csvToRecords', () => {
  it('maps headers to row objects', () => {
    const { headers, rows } = csvToRecords('familyName,address\nכהן,רחוב 1\nלוי,רחוב 2');
    expect(headers).toEqual(['familyName', 'address']);
    expect(rows).toEqual([
      { familyName: 'כהן', address: 'רחוב 1' },
      { familyName: 'לוי', address: 'רחוב 2' },
    ]);
  });
  it('handles missing trailing cells', () => {
    const { rows } = csvToRecords('a,b,c\n1,2');
    expect(rows[0]).toEqual({ a: '1', b: '2', c: '' });
  });
});
