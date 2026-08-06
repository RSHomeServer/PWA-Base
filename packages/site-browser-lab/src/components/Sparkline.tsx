import { Sparkline as UiSparkline, type SparklineProps as UiSparklineProps } from "@platform/ui";

export type SparklineProps = UiSparklineProps;

export function Sparkline({ color = "var(--lab-teal)", ...props }: SparklineProps) {
  return <UiSparkline color={color} {...props} />;
}
