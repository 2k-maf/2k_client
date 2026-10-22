import {
  clampOctetInput,
  hostFromOctets,
  obsUrlForHost,
  octetComplete,
  octetsFromHost,
  octetsFromText,
  resolveObsUrl,
} from './obsHost';

test('адреса розкладається на чотири числа', () => {
  expect(octetsFromHost('192.168.1.73')).toEqual(['192', '168', '1', '73']);
  expect(octetsFromHost('10.0.0.256')).toEqual(['', '', '', '']);
  expect(hostFromOctets(['192', '168', '1', '73'])).toBe('192.168.1.73');
  expect(hostFromOctets(['192', '168', '1', ''])).toBeNull();
});

test('вставка з крапками розбирається сама', () => {
  expect(octetsFromText(' 10.0.0.8 ')).toEqual(['10', '0', '0', '8']);
  expect(octetsFromText('192168001073')).toEqual(['192', '168', '1', '73']);
  expect(octetsFromText('192.168.1')).toBeNull();
});

test('зайва цифра за 255 не потрапляє в поле', () => {
  expect(clampOctetInput('25a6')).toBe('25');
  expect(clampOctetInput('73')).toBe('73');
  expect(clampOctetInput('')).toBe('');
});

test('повний октет сам переходить далі, без крапки', () => {
  expect(octetComplete('192')).toBe(true);
  expect(octetComplete('73')).toBe(true);
  expect(octetComplete('26')).toBe(true);
  expect(octetComplete('25')).toBe(false);
  expect(octetComplete('1')).toBe(false);
  expect(octetComplete('256')).toBe(false);
});

test('без збереженої адреси підключення йде на цей ноутбук', () => {
  expect(resolveObsUrl('ws://192.168.1.73:4455', null)).toBe('ws://127.0.0.1:4455');
  expect(resolveObsUrl('', null)).toBe('ws://127.0.0.1:4455');
  expect(resolveObsUrl('ws://192.168.1.73:4455', '10.0.0.8')).toBe('ws://10.0.0.8:4455');
});

test('новий хост зберігає порт і схему', () => {
  expect(obsUrlForHost('ws://192.168.1.73:4455', '10.0.0.8')).toBe('ws://10.0.0.8:4455');
  expect(obsUrlForHost('wss://studio.local:4456', '10.0.0.8')).toBe('wss://10.0.0.8:4456');
  expect(obsUrlForHost('', '10.0.0.8')).toBe('ws://10.0.0.8:4455');
});
