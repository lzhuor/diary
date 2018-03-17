import appendQuery from 'append-query';

const PROTOCOL = process.env.REACT_APP_PROTOCOL;
const DOMAIN = process.env.REACT_APP_DOMAIN;
const PORT = process.env.REACT_APP_PORT;
const PREFIX =
  (PROTOCOL ? PROTOCOL + '://' : '') +
  (DOMAIN ? DOMAIN : '') +
  (PORT ? ':' + PORT : '') +
  '/';
const apis = {
  apiTest: 'api/apiTest',
  login: 'api/login',

  getEntries: 'api/getEntries',
  postEntry: 'api/postEntry',
  deleteEntry: 'api/deleteEntry',

  getTodos: 'api/getTodos',
  postTodo: 'api/postTodo',
  deleteTodo: 'api/deleteTodo',

  errReport: 'api/errReport',
};

const apiTest = () => {
  return new Promise((resolve, reject) => {
    fetch(PREFIX + apis.apiTest, {
      credentials: 'same-origin',
    }).then(
      (res) => {
        resolve(res.json());
      },
      (err) => {
        reject(err);
      }
    );
  });
};
class ErrReportParams {
  public err: {
    message?: string;
    source?: any;
    lineno?: any;
    colno?: any;
    errJson?: any;
  }
}
const errReport = (params: ErrReportParams) => {
  return new Promise((resolve, reject) => {
    fetch(PREFIX + apis.errReport, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    }).then(
      (res) => {
        resolve(res.json());
      },
      (err) => {
        reject(err);
      }
    );
  });
};
class LoginParams {
  public username: string;
  public password: string;
}
const login = (params: LoginParams) => {
  return new Promise((resolve, reject) => {
    fetch(PREFIX + apis.login, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(params),
    }).then(
      (res) => {
        resolve(res.json());
      },
      (err) => {
        reject(err);
      }
    );
  });
};

export class Entry {
  public _id?: string;
  public date: string;
  public title: string;
  public content: string;
  public points: number;
}
class GetEntriesParams {
  public date: string;
  public owner: string;
}
const getEntries = (params: GetEntriesParams) => {
  const url = appendQuery(PREFIX + apis.getEntries, params);
  return new Promise((resolve, reject) => {
    fetch(url, {
      credentials: 'same-origin',
    }).then(
      (res) => {
        resolve(res.json());
      },
      (err) => {
        reject(err);
      }
    );
  });
};
class PostEntryParams {
  public data: {
    owner: string;
    entry: Entry;
  }
}
const postEntry = (params: PostEntryParams) => {
  return new Promise((resolve, reject) => {
    fetch(PREFIX + apis.postEntry, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(params),
    }).then(
      (res) => {
        resolve(res.json());
      },
      (err) => {
        reject(err);
      }
    );
  });
};
class DeleteEntryParams {
  public data: {
    owner: string;
    entry: Entry;
  }
}
const deleteEntry = (params: DeleteEntryParams) => {
  return new Promise((resolve, reject) => {
    fetch(PREFIX + apis.deleteEntry, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(params),
    }).then(
      (res) => {
        resolve(res.json());
      },
      (err) => {
        reject(err);
      }
    );
  });
};

export class Todo {
  public _id?: string;
  public date: string;
  public title: string;
  public content: string;
  public priority: number;
  public check: boolean;
}
class GetTodosParams {
  public owner: string;
}
const getTodos = (params: GetTodosParams) => {
  const url = appendQuery(PREFIX + apis.getTodos, params);
  return new Promise((resolve, reject) => {
    fetch(url, {
      credentials: 'same-origin',
    }).then(
      (res) => {
        resolve(res.json());
      },
      (err) => {
        reject(err);
      }
    );
  });
};
class PostTodosParams {
  public data: {
    owner: string;
    todo: Todo;
  }
}
const postTodo = (params: PostTodosParams) => {
  return new Promise((resolve, reject) => {
    fetch(PREFIX + apis.postTodo, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(params),
    }).then(
      (res) => {
        resolve(res.json());
      },
      (err) => {
        reject(err);
      }
    );
  });
};
class DeleteTodoParams {
  public data: {
    owner: string;
    todo: Todo;
  }
}
const deleteTodo = (params: DeleteTodoParams) => {
  return new Promise((resolve, reject) => {
    fetch(PREFIX + apis.deleteTodo, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(params),
    }).then(
      (res) => {
        resolve(res.json());
      },
      (err) => {
        reject(err);
      }
    );
  });
};

export default {
  apiTest,
  login,
  errReport,

  getEntries,
  postEntry,
  deleteEntry,

  getTodos,
  postTodo,
  deleteTodo,
};
