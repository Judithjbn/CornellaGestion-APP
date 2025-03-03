import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import FormBuilder from "@/components/form-builder";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Loader2, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function FormsPage() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [editingForm, setEditingForm] = useState<Form | null>(null);
  const [formToDelete, setFormToDelete] = useState<Form | null>(null);

  const { data: forms, isLoading } = useQuery<Form[]>({
    queryKey: ["/api/forms"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/forms");
      return res.json();
    },
  });

  const createFormMutation = useMutation({
    mutationFn: async (formData: Omit<Form, "id">) => {
      const res = await apiRequest("POST", "/api/forms", formData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      setIsCreating(false);
      toast({
        title: "Éxito",
        description: "Formulario creado correctamente",
      });
    },
  });

  const updateFormMutation = useMutation({
    mutationFn: async (formData: Form) => {
      const res = await apiRequest("PUT", `/api/forms/${formData.id}`, formData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      setEditingForm(null);
      toast({
        title: "Éxito",
        description: "Formulario actualizado correctamente",
      });
    },
  });

  const deleteFormMutation = useMutation({
    mutationFn: async (formId: number) => {
      await apiRequest("DELETE", `/api/forms/${formId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      setFormToDelete(null);
      toast({
        title: "Éxito",
        description: "Formulario eliminado correctamente",
      });
    },
  });

  const handleViewForm = (formId: number) => {
    const formUrl = `${window.location.origin}/form/${formId}`;
    window.open(formUrl, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h1 className="text-2xl sm:text-3xl font-bold">Formularios</h1>
        <Button onClick={() => setIsCreating(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Formulario
        </Button>
      </div>

      {(isCreating || editingForm) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingForm ? "Editar Formulario" : "Nuevo Formulario"}</CardTitle>
          </CardHeader>
          <CardContent>
            <FormBuilder
              initialData={editingForm}
              onSubmit={(formData) => {
                if (editingForm) {
                  updateFormMutation.mutate({ ...formData, id: editingForm.id });
                } else {
                  createFormMutation.mutate(formData);
                }
              }}
              onCancel={() => {
                setIsCreating(false);
                setEditingForm(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {forms?.map((form) => (
          <Card key={form.id}>
            <CardHeader>
              <CardTitle>{form.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {form.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`/form/${form.id}`, '_blank')}
                >
                  Ver Formulario
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setEditingForm(form)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setFormToDelete(form)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!formToDelete} onOpenChange={() => setFormToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el formulario
              "{formToDelete?.title}" y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => formToDelete && deleteFormMutation.mutate(formToDelete.id)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}