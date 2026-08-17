<script lang="ts">
  import { untrack } from "svelte"

  interface Props {
    side: "l" | "r"
    svgColor: string
  }
  const { side, svgColor }: Props = $props()

  const svgPath = untrack(() =>
    side === "l"
      ? "M85 0 A61 101 0 0 0 85 186 L75 186 A65 101 0 0 1 75 0"
      : "M24 0 A61 101 0 0 1 24 186 L34 186 A65 101 0 0 0 34 0",
  )
</script>

<svg class="h-full w-[0.85em]" preserveAspectRatio="none" viewBox="3 0 106 186">
  <path d={svgPath} fill={svgColor} stroke={svgColor}></path>
</svg>
