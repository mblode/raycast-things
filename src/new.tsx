import { ActionPanel, Form, showToast, ToastStyle, Icon, useNavigation } from "@raycast/api";
import _ from "lodash";
import { exec } from "child_process";
import { useState } from "react";
import { promisify } from "util";
import { ListName } from "./utils/types";
import ShowList from "./components/ShowList";

const asyncExec = promisify(exec);

interface FormValues {
  title: string;
  notes: string;
  tags: string[];
  list: string | undefined;
  when: Date | undefined;
  "checklist-items": string;
  deadline: Date | undefined;
}

const buildJSON = (values: FormValues) => [
  {
    type: "to-do",
    operation: "create",
    attributes: {
      title: values.title,
      notes: values.notes,
      when: values.list === "upcoming" && values.when ? values.when : values.list,
      deadline: values.deadline,
      tags: values.tags,
      "checklist-items": _(values["checklist-items"])
        .split("\n")
        .compact()
        .map((title: string) => ({
          type: "checklist-item",
          attributes: {
            title,
          },
        }))
        .value(),
    },
  },
];

const getTargetListName = (list: FormValues["list"]): ListName => {
  if (list === "today" || list === "evening") {
    return ListName.Today;
  } else if (list === "tomorrow" || list === "upcoming") {
    return ListName.Upcoming;
  } else if (list === "anytime") {
    return ListName.Anytime;
  } else if (list === "someday") {
    return ListName.Someday;
  } else {
    return ListName.Inbox;
  }
};

export default function AddNewTodo({ title, listName }: { title?: string; listName?: string }) {
  const defaultValues: FormValues = {
    title: title || "",
    notes: "",
    tags: [],
    list: listName ? listName?.toLowerCase() : "today",
    when: undefined,
    "checklist-items": "",
    deadline: undefined,
  };

  const [values, setValues] = useState<FormValues>(defaultValues);
  const { push } = useNavigation();

  const setValue = (key: string) => (value: string | string[] | Date) => {
    setValues({ ...values, [key]: value });
  };

  const addNewTodo = async () => {
    if (!values.title) {
      showToast(ToastStyle.Failure, "Title is required");
      return;
    }

    const json = buildJSON(values);
    const url = `open -g things:///json?data=${encodeURIComponent(JSON.stringify(json))}`;
    await asyncExec(url);

    showToast(ToastStyle.Success, "Added New To-Do");
    setValues({ ...defaultValues, title: "" });
  };

  const addNewTodoAndGoToList = async () => {
    await addNewTodo();
    const listName = getTargetListName(values.list);
    push(<ShowList listName={listName} />);
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <ActionPanel.Item title="Add New To-Do" onAction={addNewTodo} icon={Icon.Plus} />
          <ActionPanel.Item
            title="Add New To-Do and Go To List"
            onAction={addNewTodoAndGoToList}
            icon={Icon.ArrowRight}
          />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="Title" value={values.title} onChange={setValue("title")} />
      <Form.TextArea id="notes" title="Notes" value={values.notes} onChange={setValue("notes")} />

      <Form.Separator />

      <Form.Dropdown id="list" title="List" value={values.list} onChange={setValue("list")}>
        <Form.Dropdown.Item value="inbox" title="Inbox" />
        <Form.Dropdown.Item value="today" title="Today" />
        <Form.Dropdown.Item value="evening" title="This Evening" />
        <Form.Dropdown.Item value="tomorrow" title="Tomorrow" />
        <Form.Dropdown.Item value="upcoming" title="Upcoming" />
        <Form.Dropdown.Item value="anytime" title="Anytime" />
        <Form.Dropdown.Item value="someday" title="Someday" />
      </Form.Dropdown>

      {values.list === "upcoming" && (
        <Form.DatePicker id="when" title="When" value={values.when} onChange={setValue("when")} />
      )}

      <Form.TextArea
        id="checklist-items"
        title="Checklist Items"
        placeholder="Separated by new lines..."
        value={values["checklist-items"]}
        onChange={setValue("checklist-items")}
      />

      <Form.DatePicker id="deadline" title="Deadline" value={values.deadline} onChange={setValue("deadline")} />
    </Form>
  );
}
