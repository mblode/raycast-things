import {
  List,
  Icon,
  ActionPanel,
  OpenInBrowserAction,
  PushAction,
  showToast,
  ToastStyle,
  OpenAction,
  preferences,
  CopyToClipboardAction,
} from "@raycast/api";
import { useEffect, useState, Fragment } from "react";
import { ListName, Todo } from "../utils/types";
import AddNewTodo from "../new";
import { useThingsDb } from "../utils/hooks";
import open from "open";

interface Props {
  todo: Todo;
  isCompleted: boolean;
  complete: (id: string) => void;
  incomplete: (id: string) => void;
  listName: ListName;
}

function TodoListItem({ todo, isCompleted, complete, incomplete, listName }: Props) {
  const { id, title, notes } = todo;

  return (
    <List.Item
      key={id}
      title={title}
      subtitle={notes}
      icon={isCompleted ? Icon.Checkmark : Icon.Circle}
      actions={
        <ActionPanel>
          <ActionPanel.Section title={`Todo: ${title}`}>
            <OpenAction title="Open in Things" target={`things:///show?id=${todo.id}`} icon={Icon.ArrowRight} />

            {!isCompleted && (
              <ActionPanel.Item
                title="Mark as Completed"
                icon={Icon.Circle}
                shortcut={{ modifiers: ["cmd"], key: "d" }}
                onAction={async () => {
                  open(
                    `things://x-callback-url/update?auth-token=${preferences.token.value}&id=${todo.id}&completed=true`,
                    {
                      background: true,
                    }
                  );
                  await complete(id);
                  await showToast(ToastStyle.Success, "Marked as Completed");
                }}
              />
            )}

            {isCompleted && (
              <ActionPanel.Item
                title="Mark as Incomplete"
                icon={Icon.XmarkCircle}
                shortcut={{ modifiers: ["cmd"], key: "d" }}
                onAction={async () => {
                  open(
                    `things://x-callback-url/update?auth-token=${preferences.token.value}&id=${todo.id}&completed=false`,
                    {
                      background: true,
                    }
                  );
                  await incomplete(id);
                  await showToast(ToastStyle.Success, "Marked as Incompleted");
                }}
              />
            )}

            <CopyToClipboardAction
              title="Copy Title"
              content={todo.title}
              icon={Icon.Clipboard}
              shortcut={{ modifiers: ["cmd"], key: "c" }}
            />
          </ActionPanel.Section>

          <ActionPanel.Section title={`List: ${listName}`}>
            <OpenInBrowserAction
              title="Open in Things"
              icon={Icon.ArrowRight}
              shortcut={{ modifiers: ["ctrl"], key: "o" }}
              url={`things:///show?id=${listName.toLowerCase()}`}
            />

            <PushAction
              title="Add New To-Do"
              icon={Icon.Plus}
              shortcut={{ modifiers: ["cmd"], key: "n" }}
              target={<AddNewTodo listName={listName} />}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

const plural = (count: number, string: string) => `${count} ${string}${count > 1 ? "s" : ""}`;

const normalizeText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function ShowList({ listName }: { listName: ListName }) {
  const [db, error] = useThingsDb();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    if (db != null) {
      setTodos(db.getTodos(listName));
    }
  }, [db]);

  if (error) {
    showToast(ToastStyle.Failure, "Something went wrong", error.message);
  }

  const complete = (id: string) => {
    const newCompleted = [...completed];
    newCompleted.push(id);
    setCompleted(newCompleted);
  };

  const incomplete = (id: string) => {
    setCompleted(completed.filter((completedTodoId) => !completedTodoId.includes(id)));
  };

  const normalizedSearchText = normalizeText(searchText);

  const filteredTodos = todos.filter((todo) => normalizeText(todo.title).includes(normalizedSearchText));

  return (
    <List
      isLoading={todos == undefined}
      searchBarPlaceholder="Filter by to-do title..."
      onSearchTextChange={setSearchText}
    >
      <List.Section subtitle={plural(todos.length, "todo")}>
        {filteredTodos.map((todo) => (
          <TodoListItem
            key={todo.id}
            todo={todo}
            listName={listName}
            isCompleted={completed.includes(todo.id)}
            complete={complete}
            incomplete={incomplete}
          />
        ))}
      </List.Section>

      <List.Section title={`Use "${searchText}" with…`}>
        {searchText !== "" && (
          <Fragment>
            <List.Item
              key="fallback-add-new-todo"
              title="Add New To-Do"
              icon={Icon.Plus}
              actions={
                <ActionPanel>
                  <PushAction
                    icon={Icon.Plus}
                    title="Add New To-Do"
                    target={<AddNewTodo title={searchText} listName={listName} />}
                  />
                </ActionPanel>
              }
            />

            <List.Item
              key="fallback-search-in-things"
              title="Search in Things"
              icon={Icon.MagnifyingGlass}
              actions={
                <ActionPanel>
                  <OpenInBrowserAction
                    title="Search in Things"
                    icon={Icon.MagnifyingGlass}
                    url={`things:///search?query=${searchText}`}
                  />
                </ActionPanel>
              }
            />
          </Fragment>
        )}
      </List.Section>
    </List>
  );
}
