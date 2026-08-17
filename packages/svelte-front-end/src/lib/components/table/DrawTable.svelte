<script lang="ts">
  import TableCell from "$lib/components/table/TableCell.svelte"
  import { cn } from "$lib/utils.ts"
  import { isMobileOrTablet } from "$lib/utils/deviceInformation.ts"
  import type { TableNode } from "@shared/utils/parseMarkdown.ts"
  import MarkdownTree from "../markdown/markdownTree.svelte"

  interface Props {
    table: TableNode
  }
  const props: Props = $props()
  const table = $derived(props.table)
  const header = $derived(table.format.header)
  const vLines = $derived(table.format.vLines)
  const hLines = $derived(table.format.hLines)
  const alignment = $derived(table.format.alignment)
  const headerRow = $derived(header ? table.content[0] : undefined)
  const bodyRows = $derived(header ? table.content.slice(1) : table.content)
  const hasZebra = $derived(bodyRows.length >= 5)
</script>

<div class={`${isMobileOrTablet ? "overflow-x-scroll" : ""}`}>
  <table class="text-foreground bg-background my-5 w-auto border-collapse rounded-sm">
    {#if headerRow}
      <thead
        class="[&_tr:first-child_>_th:first-child]:rounded-tl-sm [&_tr:first-child_>_th:last-child]:rounded-tr-sm"
      >
        <tr>
          {#each headerRow as cell, j (j)}
            <TableCell
              rightBorder={vLines.includes(j)}
              alignment={alignment[j]}
              bottomBorder={true}
              header={true}
            >
              <MarkdownTree t={cell} />
            </TableCell>
          {/each}
        </tr>
      </thead>
    {/if}
    <tbody
      class={cn(hasZebra && "[&>tr:nth-child(even)>td]:bg-muted [&>tr:nth-child(odd)>td]:bg-background")}
    >
      {#each bodyRows as row, i (i)}
        <tr>
          {#each row as cell, j (j)}
            <TableCell
              rightBorder={vLines.includes(j)}
              bottomBorder={hLines.includes(i + (headerRow ? 1 : 0))}
              alignment={alignment[j]}
            >
              <MarkdownTree t={cell} />
            </TableCell>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
