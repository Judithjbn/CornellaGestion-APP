import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Form, FormField, formFieldSchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface FormData {
  [key: string]: string | boolean;
}

export default function FormView() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const formId = parseInt(id);

  const { data: form, isLoading } = useQuery<Form>({
    queryKey: [`/api/forms/${formId}`],
  });

  const formMethods = useForm<FormData>({
    defaultValues: {},
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", `/api/forms/${formId}/submissions`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Formulario enviado correctamente",
      });
      formMethods.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Hubo un error al enviar el formulario",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!form) {
    return <div>Formulario no encontrado</div>;
  }

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <Input
            type={field.type}
            {...formMethods.register(field.id)}
            required={field.required}
          />
        );
      case 'textarea':
        return (
          <Textarea
            {...formMethods.register(field.id)}
            required={field.required}
          />
        );
      case 'select':
        return (
          <Select
            onValueChange={(value) => formMethods.setValue(field.id, value)}
            required={field.required}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una opción" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'checkbox':
        return (
          <Checkbox
            {...formMethods.register(field.id)}
            required={field.required}
          />
        );
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>{form.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={formMethods.handleSubmit((data) => submitMutation.mutate(data))} className="space-y-6">
            {(form.fields as FormField[]).map((field) => (
              <div key={field.id} className="space-y-2">
                <label className="text-sm font-medium">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))}
            <Button type="submit" disabled={submitMutation.isPending}>
              {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}