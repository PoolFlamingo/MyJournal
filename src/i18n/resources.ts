export type SupportedLanguage = "es" | "en";

export const resources = {
  es: {
    common: {
      title: "Tauract",
      subtitle: "Gestor de tareas",
      footer: "Tauri + React + Bun + SQLite",
      theme: {
        change: "Cambiar tema",
        light: "Claro",
        dark: "Oscuro",
        system: "Sistema",
      },
      language: {
        label: "Idioma",
        es: "Español",
        en: "English",
      },
      errors: {
        loadFailed: "Error al cargar las tareas",
      },
    },
    todo: {
      form: {
        titleLabel: "Título",
        descriptionLabel: "Descripción",
        titlePlaceholder: "¿Qué necesitas hacer?",
        descriptionPlaceholder: "Descripción (opcional)",
        save: "Guardar",
        add: "Añadir",
        cancel: "Cancelar",
      },
      filters: {
        all: "Todos",
        active: "Activos",
        completed: "Completados",
        clearCompleted: "Limpiar completados",
      },
      list: {
        emptyTitle: "No hay tareas todavía",
        emptyDescription: "Añade una nueva tarea usando el formulario de arriba",
      },
      item: {
        edit: "Editar",
        delete: "Eliminar",
        confirmTitle: "Eliminar tarea",
        confirmMessage: "¿Estás seguro de que quieres eliminar \"{{title}}\"?",
        confirmWarning: "Esta acción no se puede deshacer.",
        markPending: "pendiente",
        markCompleted: "completada",
        checkboxLabel: 'Marcar "{{title}}" como {{status}}',
        editTitle: "Editar tarea",
      },
    },
  },
  en: {
    common: {
      title: "Tauract",
      subtitle: "Task manager",
      footer: "Tauri + React + Bun + SQLite",
      theme: {
        change: "Change theme",
        light: "Light",
        dark: "Dark",
        system: "System",
      },
      language: {
        label: "Language",
        es: "Español",
        en: "English",
      },
      errors: {
        loadFailed: "Failed to load tasks",
      },
    },
    todo: {
      form: {
        titleLabel: "Title",
        descriptionLabel: "Description",
        titlePlaceholder: "What do you need to do?",
        descriptionPlaceholder: "Description (optional)",
        save: "Save",
        add: "Add",
        cancel: "Cancel",
      },
      filters: {
        all: "All",
        active: "Active",
        completed: "Completed",
        clearCompleted: "Clear completed",
      },
      list: {
        emptyTitle: "No tasks yet",
        emptyDescription: "Add a new task using the form above",
      },
      item: {
        edit: "Edit",
        delete: "Delete",
        confirmTitle: "Delete task",
        confirmMessage: "Are you sure you want to delete \"{{title}}\"?",
        confirmWarning: "This action cannot be undone.",
        markPending: "pending",
        markCompleted: "completed",
        checkboxLabel: 'Mark "{{title}}" as {{status}}',
        editTitle: "Edit task",
      },
    },
  },
} as const;
