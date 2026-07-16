"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { buildCommandEditorPatch } from "@/lib/command-editor";
import { getApiErrorMessage } from "@/lib/utils/api-error";
import { commandSchemaEditorSchema, type CommandSchemaEditorInput } from "@/lib/validations/forms";

type ExistingStep = { api_route?: unknown; http_method?: unknown };

function firstExistingStep(steps: unknown): ExistingStep {
  return Array.isArray(steps) && typeof steps[0] === "object" && steps[0] !== null ? steps[0] as ExistingStep : {};
}

function approvalThreshold(approvalRules: unknown): string {
  if (!approvalRules || typeof approvalRules !== "object" || Array.isArray(approvalRules)) return "";
  const threshold = (approvalRules as Record<string, unknown>).amount_greater_than;
  return typeof threshold === "number" ? String(threshold) : "";
}

export function CommandSchemaEditor({ commandId, inputSchema, outputSchema, approvalRules, steps }: { commandId: string; inputSchema: unknown; outputSchema: unknown; approvalRules: unknown; steps: unknown }) {
  const router = useRouter();
  const existingStep = firstExistingStep(steps);
  const form = useForm<CommandSchemaEditorInput>({
    resolver: zodResolver(commandSchemaEditorSchema),
    defaultValues: {
      input_schema_json: JSON.stringify(inputSchema, null, 2),
      output_schema_json: JSON.stringify(outputSchema, null, 2),
      api_route: typeof existingStep.api_route === "string" ? existingStep.api_route : "/",
      http_method: existingStep.http_method === "GET" || existingStep.http_method === "POST" || existingStep.http_method === "PATCH" || existingStep.http_method === "PUT" || existingStep.http_method === "DELETE" ? existingStep.http_method : "POST",
      approval_threshold: approvalThreshold(approvalRules),
    },
  });

  async function onSubmit(values: CommandSchemaEditorInput) {
    const response = await fetch(`/api/commands/${commandId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        input_schema_json: JSON.parse(values.input_schema_json),
        output_schema_json: JSON.parse(values.output_schema_json),
        ...buildCommandEditorPatch({ apiRoute: values.api_route, httpMethod: values.http_method, approvalThreshold: values.approval_threshold }),
      }),
    });
    const json = await response.json();
    if (!response.ok) {
      toast.error(getApiErrorMessage(json, "Update failed"));
      return;
    }
    toast.success("Command contract updated");
    router.refresh();
  }

  async function publish() {
    const response = await fetch(`/api/commands/${commandId}/publish`, { method: "POST" });
    const json = await response.json();
    if (!response.ok) {
      toast.error(getApiErrorMessage(json, "Publish failed"));
      return;
    }
    toast.success("Command published");
    router.refresh();
  }

  async function pause() {
    const response = await fetch(`/api/commands/${commandId}/pause`, { method: "POST" });
    const json = await response.json();
    if (!response.ok) {
      toast.error(getApiErrorMessage(json, "Pause failed"));
      return;
    }
    toast.success("Command paused");
    router.refresh();
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold">Command contract</h3>
      <p className="mt-1 text-sm text-[var(--muted-text)]">Choose the reviewed API call and approval threshold. Input and output schemas remain editable JSON contracts.</p>
      <form className="mt-4 grid gap-3" onSubmit={form.handleSubmit(onSubmit)}>
        <label className="grid gap-1 text-sm">Input schema JSON<Textarea rows={8} aria-label="Input schema JSON" {...form.register("input_schema_json")} /></label>
        <label className="grid gap-1 text-sm">Output schema JSON<Textarea rows={8} aria-label="Output schema JSON" {...form.register("output_schema_json")} /></label>
        <label className="grid gap-1 text-sm">API route<Input aria-label="API route" placeholder="/api/v2/tickets/{ticket_id}.json" {...form.register("api_route")} /></label>
        <label className="grid gap-1 text-sm">HTTP method<Select aria-label="HTTP method" {...form.register("http_method")}><option value="GET">GET</option><option value="POST">POST</option><option value="PATCH">PATCH</option><option value="PUT">PUT</option><option value="DELETE">DELETE</option></Select></label>
        <label className="grid gap-1 text-sm">Approval threshold (optional)<Input aria-label="Approval threshold" inputMode="decimal" placeholder="250" {...form.register("approval_threshold")} /></label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit">Save contract</Button>
          <Button type="button" variant="secondary" onClick={publish}>Publish version</Button>
          <Button type="button" variant="secondary" onClick={pause}>Pause</Button>
        </div>
      </form>
    </Card>
  );
}
