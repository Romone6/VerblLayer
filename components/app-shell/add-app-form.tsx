"use client";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { appFormSchema, type AppFormInput } from "@/lib/validations/forms";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function AddAppForm() {
  const router = useRouter();
  const form = useForm<AppFormInput>({ resolver: zodResolver(appFormSchema), defaultValues: { name: "", base_url: "http://localhost:3100", type: "internal_web_app", provider_key: "internal_acme_support_admin", auth_method: "none", execution_mode: "api" } });
  async function onSubmit(values: AppFormInput) {
    const response = await fetch("/api/apps", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
    if (!response.ok) { toast.error("Unable to create app"); return; }
    toast.success("App created"); form.reset(); router.refresh();
  }
  return <Card><h3 className="text-lg font-semibold">Register controlled target</h3><form className="mt-4 grid gap-3" onSubmit={form.handleSubmit(onSubmit)}><Input placeholder="Acme Support Admin" {...form.register("name")} /><Select {...form.register("type")}><option value="internal_web_app">internal_web_app</option><option value="custom_web_app">custom_web_app</option><option value="api_schema">api_schema</option><option value="uploaded_workflow_evidence">uploaded_workflow_evidence</option></Select><Input placeholder="http://localhost:3100" {...form.register("base_url")} /><Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving..." : "Create app"}</Button></form></Card>;
}

export function TestConnectionButton({ appId }: { appId: string }) {
  const router = useRouter();
  async function onClick() { const response = await fetch(`/api/apps/${appId}/test-connection`, { method: "POST" }); toast[response.ok ? "success" : "error"](response.ok ? "Connection tested" : "Connection failed"); router.refresh(); }
  return <Button type="button" variant="secondary" size="sm" onClick={onClick}>Test connection</Button>;
}
