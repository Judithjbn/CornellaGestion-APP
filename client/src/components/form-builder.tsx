import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, X } from "lucide-react";

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Número' },
  { value: 'textarea', label: 'Área de Texto' },
  { value: 'select', label: 'Selección' },
  { value: 'checkbox', label: 'Casilla de Verificación' },
];

interface FormBuilderProps {
  initialData?: Form;
  onSubmit: (form: Omit<Form, "id">) => void;
  onCancel: () => void;
}

export default function FormBuilder({ initialData, onSubmit, onCancel }: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(initialData?.fields as FormField[] || []);
  const form = useForm({
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
    },
  });

  const addField = () => {
    setFields([
      ...fields,
      {
        id: crypto.randomUUID(),
        type: 'text',
        label: '',
        required: false,
      },
    ]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const handleSubmit = (data: any) => {
    onSubmit({
      title: data.title,
      description: data.description,
      fields,
      createdAt: initialData?.createdAt || new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Título del Formulario</label>
          <Input {...form.register("title")} required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Descripción</label>
          <Textarea {...form.register("description")} />
        </div>

        <div className="space-y-4">
          {fields.map((field) => (
            <Card key={field.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Etiqueta del Campo"
                        value={field.label}
                        onChange={(e) =>
                          updateField(field.id, { label: e.target.value })
                        }
                      />
                      <Select
                        value={field.type}
                        onValueChange={(value: any) =>
                          updateField(field.id, { type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`required-${field.id}`}
                        checked={field.required}
                        onCheckedChange={(checked) =>
                          updateField(field.id, { required: !!checked })
                        }
                      />
                      <label
                        htmlFor={`required-${field.id}`}
                        className="text-sm font-medium"
                      >
                        Obligatorio
                      </label>
                    </div>

                    {field.type === 'select' && (
                      <Input
                        placeholder="Opciones (separadas por comas)"
                        value={field.options?.join(', ')}
                        onChange={(e) =>
                          updateField(field.id, {
                            options: e.target.value.split(',').map((o) => o.trim()),
                          })
                        }
                      />
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeField(field.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={addField}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Campo
        </Button>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {initialData ? 'Guardar Cambios' : 'Crear Formulario'}
          </Button>
        </div>
      </form>
    </div>
  );
}