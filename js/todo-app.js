/*jshint esnext:true */

// TodoApp Module
// -----------------------------

// ES6 modules allow us to define isolated blocks of reusable code without
// having to wrap it into an object or closure. Only those functions and
// variables we explicitly `export` are available to other consumers
// and we can just as easily `import` functionality from other modules.
// It's possible to rename exported values, define modules that are inline
// and even declare defaults for import/export.

// In order to annotate our classes, we need to import some annotations from the
// DI framework.
import {Inject, InjectLazy} from 'di';

// #### Destructuring Assignments
// Constant (`const`) definitions are block scoped, but their values are read-only.
// This means they cannot be re-declared later on. Backbone's core component
// definitions don't need to be modified, so we can combine constants and an ES6 pattern
// called destructuring assignment to create shorter aliases for Models, Views
// and other components. This avoids the need to use the more verbose `Backbone.*`
// forms we're accustomed to. Destructuring of array and object data uses a syntax
// that mirrors the construction of array and object literals.

// Const currently disabled due to https://github.com/google/traceur-compiler/issues/595
// but would otherwise be written:
// `const { Model, View, Collection, Router, LocalStorage } = Backbone;`
var { Model, View, Collection, Router, LocalStorage } = Backbone;



var ENTER_KEY = 13; // const


// Todo Model class
// ----------------

// #### Classes
// In JavaScript, we've relied on prototypal inheritance anytime we've needed
// a class-like system. This has led to overly verbose code using custom types.
// ES6 changes that by removing the ugly multi-step inheritance patterns we're
// used to and introducing a minimal class syntax that makes defining classes a
// lot more terse.

// ES6 classes desugar to prototypal inheritance behind the scenes and the only
// real change is that there's less typing required for us. Classes are compact
// and we can use an 'extend' keyword to implement a new sub-class from a
// base-class. Below, we do this to define a `Todo` class which `extends` Backbone's
// Model component.
class Todo extends Model {

  // Note the omission of the 'function' keyword— it is entirely optional in
  // ES6.

  // *Define some default attributes for the todo.*
  defaults() {
    return {
      title: '',
      completed: false
    };
  }

  // *Toggle the `completed` state of this todo item.*
  toggle() {
    this.save({
      completed: !this.get('completed')
    });
  }
}


// TodoList Collection class
// -------------------------

// The collection of todos is backed by *localStorage* instead of a remote
// server.
class TodoList extends Collection {

  // #### Constructors and Super Constructors
  // Specifying a `constructor` lets us define the class constructor. Use of the
  // `super` keyword in your constructor lets you call the constructor of a parent
  // class so that it can inherit all of its properties.
  constructor(options) {
    super(options);

    // *Hold a reference to this collection's model.*
    this.model = Todo;

    // *Save all of the todo items under the `'todos'` namespace.*
    this.localStorage = new LocalStorage('todos-traceur-backbone');
  }

  // *Filter down the list of all todo items that are finished.*

  // #### Arrow Functions (Expressions)
  // The arrow (`=>`) is shorthand syntax for an anonymous
  // function. It doesn't require the `function` keyword and the
  // parens are optional when there's a single parameter being used.
  // The value of `this` is bound to its containing scope, and when
  // an expression follows the arrow - like in this case - the arrow
  // function automatically returns that expression's value, so you
  // don't need `return`.
  //
  // Arrow functions are more lightweight
  // than normal functions, reflecting how they're expected to be used—
  // they don't have a prototype and can't act as constructors.
  // Because of how they inherit `this` from the containing scope,
  // the meaning of `this` inside of them can't be changed with `call`
  // or `apply`.
  //
  // To recap, when using `=>`:
  //
  // * The `function` keyword isn't required.
  // * Parentheses are optional with a single parameter.
  // * `this` is bound to the containing scope— change the context with `call`
  // or `apply`.
  // * `return` is unnecessary with a single expression.
  // * Functions are lightweight— no prototypes or constructors.
  completed() {
    return this.filter(todo => todo.get('completed'));
  }

  // *Filter down the list to only todo items that are still not finished.*
  remaining() {
    // The ES6 spread operator reduces runtime boilerplate code by allowing
    // an expression to be expanded where multiple arguments or elements are
    // normally expected. It can appear in function calls or array literals.
    // The three dot syntax below is to indicate a variable number of arguments
    // and helps us avoid hacky use of `apply` for spreading.
    //
    // Compare the old way...
    //
    //     return this.without.apply(this, this.completed());
    //
    // ...with the new, signifcantly shorter way...
    //
    //     return this.without(...this.completed());
    //
    // This doesn't require repeating the object on which the method is called
    // (`this` in our case).
    return this.without(...this.completed());
  }

  // *We keep the Todos in sequential order, despite being saved by unordered
  // GUID in the database. This generates the next order number for new
  // items.*
  nextOrder() {
    if (!this.length) {
      return 1;
    }

    return this.last().get('order') + 1;
  }

  // *Todos are sorted by their original insertion order.*
  comparator(todo) {
    return todo.get('order');
  }
}


// Todo Filter class
// -----------------

// The todo filter holds the current value of the filter
// (active, completed, or none).
class TodoFilter {
  constructor() {
    this.value = '';
  }
}


// Todo Item View class
// --------------------

// *The DOM element for a todo item...*
@Inject(TodoFilter, 'itemTemplate', 'options')
class TodoView extends View {

  constructor(filter, itemTemplate, options) {
    this.filter = filter;

    // *... is a list tag.*
    this.tagName = 'li';

    // *The TodoView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a **Todo** and a **TodoView** in this
    // app, we set a direct reference on the model for convenience.*
    this.model = Todo;

    // *Cache the template function for a single item.*
    this.template = itemTemplate;

    this.input = '';

    // *Define the DOM events specific to an item.*
    this.events = {
      'click .toggle': 'toggleCompleted',
      'dblclick label': 'edit',
      'click .destroy': 'clear',
      'keypress .edit': 'updateOnEnter',
      'blur .edit': 'close'
    };

    super(options);

    this.listenTo(this.model, 'change', this.render);
    this.listenTo(this.model, 'destroy', this.remove);
    this.listenTo(this.model, 'visible', this.toggleVisible);

  }

  // *Re-render the contents of the todo item.*
  render() {
    this.$el.html(this.template(this.model.toJSON()));
    this.$el.toggleClass('completed', this.model.get('completed'));
    this.toggleVisible();
    this.input = this.$('.edit');
    return this;
  }

  toggleVisible() {
    this.$el.toggleClass('hidden', this.isHidden);
  }

  // #### Property Getters and Setters
  // `isHidden()` is using something we call a property getter.
  // Although technically part of ECMAScript 5.1, getters and
  // setters allow us to write and read properties that lazily compute
  // their values. Properties can process values assigned in a
  // post-process step, validating and transforming during assignment.
  //
  // In general, this means using `set` and `get` to bind a property
  // of an object to a function which is invoked when the property is
  // being set and looked up. [Read more](http://ariya.ofilabs.com/2013/03/es6-and-method-definitions.html)
  // on getters and setters.
  get isHidden() {
    var isCompleted = this.model.get('completed'); // const
    return (// hidden cases only
      (!isCompleted && this.filter.value === 'completed') ||
      (isCompleted && this.filter.value === 'active')
    );
  }

  // *Toggle the `'completed'` state of the model.*
  toggleCompleted() {
    this.model.toggle();
  }

  // *Switch this view into `'editing'` mode, displaying the input field.*
  edit() {
    var value = this.input.val(); // const

    this.$el.addClass('editing');
    this.input.val(value).focus();
  }

  // *Close the `'editing'` mode, saving changes to the todo.*
  close() {
    var title = this.input.val(); // const

    if (title) {
      this.model.save({ title });
    } else {
      this.clear();
    }

    this.$el.removeClass('editing');
  }

  // *If you hit `enter`, we're through editing the item.*
  updateOnEnter(e) {
    if (e.which === ENTER_KEY) {
      this.close();
    }
  }

  // *Remove the item and destroy the model.*
  clear() {
    this.model.destroy();
  }
}

// The Application class
// ---------------------

// *Our overall **AppView** is the top-level piece of UI.*
// It gets different application components as constructor arguments,
// injected by the DI injector.
export class AppView extends View {
  constructor(
      @Inject(TodoList) todos,
      @Inject(TodoFilter) filter,
      @InjectLazy(TodoView) createTodoView,
      @Inject('statsTemplate') statsTemplate) {

    this.todos = todos;
    this.filter = filter;
    this.createTodoView = createTodoView;

    // *Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.*
    this.setElement($('#todoapp'), true);

    this.statsTemplate = statsTemplate;

    // *Delegate events for creating new items and clearing completed ones.*
    this.events = {
      'keypress #new-todo': 'createOnEnter',
      'click #clear-completed': 'clearCompleted',
      'click #toggle-all': 'toggleAllComplete'
    };

    // *At initialization, we bind to the relevant events on the `this.todos`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting todos that might be saved in localStorage.*
    this.allCheckbox = this.$('#toggle-all')[0];
    this.$input = this.$('#new-todo');
    this.$footer = this.$('#footer');
    this.$main = this.$('#main');

    this.listenTo(this.todos, 'add', this.addOne);
    this.listenTo(this.todos, 'reset', this.addAll);
    this.listenTo(this.todos, 'change:completed', this.filterOne);
    this.listenTo(this.todos, 'filter', this.filterAll);
    this.listenTo(this.todos, 'all', this.render);

    this.todos.fetch();

    super();
  }

  // *Re-rendering the App just means refreshing the statistics— the rest of
  // the app doesn't change.*
  render() {
    var completed = this.todos.completed().length; // const
    var remaining = this.todos.remaining().length; // const

    if (this.todos.length) {
      this.$main.show();
      this.$footer.show();

      this.$footer.html(
        this.statsTemplate({
          completed, remaining
        })
      );

      this.$('#filters li a')
        .removeClass('selected')
        .filter('[href="#/' + (this.filter.value || '') + '"]')
        .addClass('selected');
    } else {
      this.$main.hide();
      this.$footer.hide();
    }

    this.allCheckbox.checked = !remaining;
  }

  // *Add a single todo item to the list by creating a view for it, then
  // appending its element to the `<ul>`.*
  addOne(model) {
    var view = this.createTodoView('options', { model }); // const
    $('#todo-list').append(view.render().el);
  }

  // *Add all items in the **this.todos** collection at once.*
  addAll() {
    this.$('#todo-list').html('');
    this.todos.each(this.addOne, this);
  }

  filterOne(todo) {
    todo.trigger('visible');
  }

  filterAll() {
    this.todos.each(this.filterOne, this);
  }

  // *Generate the attributes for a new Todo item.*
  newAttributes() {
    return {
      title: this.$input.val().trim(),
      order: this.todos.nextOrder(),
      completed: false
    };
  }

  // *If you hit `enter` in the main input field, create a new **Todo** model,
  // persisting it to localStorage.*
  createOnEnter(e) {
    if (e.which !== ENTER_KEY || !this.$input.val().trim()) {
      return;
    }

    this.todos.create(this.newAttributes());
    this.$input.val('');
  }

  // *Clear all completed todo items and destroy their models.*
  clearCompleted() {
    _.invoke(this.todos.completed(), 'destroy');
    return false;
  }

  toggleAllComplete() {
    var completed = this.allCheckbox.checked; // const
    this.todos.each(todo => todo.save({ completed }));
  }
}

// The Filters Router class
// ------------------------
@Inject(TodoList, TodoFilter)
export class Filters extends Router {

  constructor(todos, todoFilter) {
    this.todos = todos;
    this.todoFilter = todoFilter;
    this.routes = {
      '*filter': 'filter'
    }

    this._bindRoutes();
  }

  // #### Default Parameters
  // `param` in the `filter()` function is using ES6's support for default
  // parameter values. Many languages support the notion of a default
  // argument for functional parameters, but JavaScript hasn't until now.
  //
  // Default parameters avoid the need to specify your own defaults within the body of a
  // function. We've worked around this by performing logical OR (`||`) checks
  // against argument values to default if they're empty/null/undefined or of
  // the incorrect type. Native default parameter values provide a much cleaner
  // solution to this problem. Notably they are only triggered by `undefined`, and
  // not by any falsy value.
  //
  // Compare the old way...
  //
  //     function hello(firstName, lastName) {
  //         firstName = firstName || 'Joe';
  //         lastName = lastName || 'Schmo';
  //         return 'Hello, ' + firstName + ' ' + lastName;
  //     }
  //
  // ...to the new way...
  //
  //     function hello(firstName = 'Joe', lastName = 'Schmo') {
  //         return 'Hello, ' + firstName + ' ' + lastName;
  //     }
  filter(param = '') {
    // *Set the current filter to be used.*
    this.todoFilter.value = param;

    // *Trigger a collection filter event, causing hiding/unhiding
    // of Todo view items.*
    this.todos.trigger('filter');
  }
}
