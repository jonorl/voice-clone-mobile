import { act, fireEvent, render, screen } from '@testing-library/react-native';
import StatusPill from '../StatusPill';
import Tune from '../TuneStep';
import Write from '../WriteStep';

const writeProps = {
  text: 'Hola',
  setText: jest.fn(),
  loading: false,
  handleGenerate: jest.fn(),
  spaceStatus: 'ready',
  error: '',
};

const tuneProps = {
  text: 'Hola',
  temperature: 0.7,
  setTemperature: jest.fn(),
  topK: 50,
  setTopK: jest.fn(),
  topP: 0.85,
  setTopP: jest.fn(),
  seed: 42,
  setSeed: jest.fn(),
  loading: false,
  handleGenerate: jest.fn(),
  spaceStatus: 'ready',
};


beforeEach(() => jest.clearAllMocks());

describe('Write', () => {
  it('generates when there is text and the server is ready', async () => {
    await render(<Write {...writeProps} />);

    await fireEvent.press(screen.getByText('✦  Generate Voice'));

    expect(writeProps.handleGenerate).toHaveBeenCalled();
  });

  it.each([
    ['there is no text', { text: '   ' }],
    ['the server is not ready', { spaceStatus: 'error' }],
  ])('does not generate when %s', async (_, overrides) => {
    await render(<Write {...writeProps} {...overrides} />);

    await fireEvent.press(screen.getByText('✦  Generate Voice'));

    expect(writeProps.handleGenerate).not.toHaveBeenCalled();
  });

  it('caps the text at the length the server accepts', async () => {
    await render(<Write {...writeProps} />);

    expect(screen.getByDisplayValue('Hola').props.maxLength).toBe(1000);
  });

  it('shows the error from the last attempt', async () => {
    await render(<Write {...writeProps} error="Please keep the text under 1000 characters." />);

    expect(screen.getByText('Please keep the text under 1000 characters.')).toBeTruthy();
  });

  it('cycles through loading messages while generating', async () => {
    jest.useFakeTimers();
    await render(<Write {...writeProps} loading />);

    expect(screen.getByText('Generating...')).toBeTruthy();
    await act(() => jest.advanceTimersByTime(2500));
    expect(screen.getByText('Loading voice model...')).toBeTruthy();
    jest.useRealTimers();
  });
});

describe('Tune', () => {
  it('generates with the chosen settings', async () => {
    await render(<Tune {...tuneProps} />);

    await fireEvent.press(screen.getByText('✦  Generate with these params'));

    expect(tuneProps.handleGenerate).toHaveBeenCalled();
  });

  it('does not generate while the server is not ready', async () => {
    await render(<Tune {...tuneProps} spaceStatus="checking" />);

    await fireEvent.press(screen.getByText('✦  Generate with these params'));

    expect(tuneProps.handleGenerate).not.toHaveBeenCalled();
  });
});

describe('StatusPill', () => {
  it.each([
    ['ready', '● Ready'],
    ['checking', '◌ Checking…'],
    ['error', '✕ Error'],
  ] as const)('shows %s', async (status, label) => {
    await render(<StatusPill spaceStatus={status} />);

    expect(screen.getByText(label)).toBeTruthy();
  });
});

describe('accessibility', () => {
  it('labels the text box and announces errors', async () => {
    await render(<Write {...writeProps} error="Please keep the text under 1000 characters." />);

    expect(screen.getByLabelText('Spanish text to speak')).toBeTruthy();
    expect(screen.getByRole('alert')).toHaveTextContent('Please keep the text under 1000 characters.');
  });

  it('marks Generate as a busy button while generating', async () => {
    await render(<Write {...writeProps} loading />);

    const button = screen.getByRole('button');
    expect(button).toBeBusy();
    expect(button).toBeDisabled();
  });

  it('names each slider and shows whole numbers without decimals', async () => {
    await render(<Tune {...tuneProps} />);

    expect(screen.getByLabelText('Temperature')).toHaveAccessibilityValue({ text: '0.70' });
    expect(screen.getByLabelText('Top-K')).toHaveAccessibilityValue({ text: '50' });
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('reads the server status as words', async () => {
    await render(<StatusPill spaceStatus="ready" />);

    expect(screen.getByLabelText('Server status: Ready')).toBeTruthy();
  });
});
