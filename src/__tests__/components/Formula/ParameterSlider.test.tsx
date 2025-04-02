import { render, screen, fireEvent } from "@testing-library/react";
import { ParameterSlider } from "@/components/Formula/ParameterSlider";

describe("ParameterSlider", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("renders with default props", () => {
    render(
      <ParameterSlider
        parameterName="a"
        value={1}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("1.0")).toBeInTheDocument();
  });

  it("renders with custom min and max values", () => {
    render(
      <ParameterSlider
        parameterName="b"
        value={2}
        onChange={mockOnChange}
        min={0}
        max={5}
      />
    );

    expect(screen.getByText("b")).toBeInTheDocument();
    expect(screen.getByText("2.0")).toBeInTheDocument();
  });

  it("calls onChange when slider value changes", () => {
    render(
      <ParameterSlider
        parameterName="c"
        value={0}
        onChange={mockOnChange}
      />
    );

    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: 'ArrowRight', code: 'ArrowRight' });

    expect(mockOnChange).toHaveBeenCalledWith(0.1);
  });

  it("displays custom step value", () => {
    render(
      <ParameterSlider
        parameterName="d"
        value={1}
        onChange={mockOnChange}
        step={0.5}
      />
    );

    expect(screen.getByText("1.0")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <ParameterSlider
        parameterName="e"
        value={1}
        onChange={mockOnChange}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
}); 