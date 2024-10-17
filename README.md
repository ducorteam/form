
useForm 
-----------

Since working with forms is so common, Inertia includes a form helper designed to help reduce the amount of boilerplate code needed for handling typical form submissions.

React
```jsx
    import { useForm } from '@ducor/helpers'
    
    const { filedData, setFiledData, req, processing, errors } = useForm({
      email: '',
      password: '',
      remember: false,
    })
    
    function submit(e) {
      e.preventDefault()
      req.post('/login')
    }
    
    return (
      <form onSubmit={submit}>
        <input type="text" value={filedData.email} onChange={e => setFiledData('email', e.target.value)} />
        {errors.email && <div>{errors.email}</div>}
        <input type="password" value={filedData.password} onChange={e => setFiledData('password', e.target.value)} />
        {errors.password && <div>{errors.password}</div>}
        <input type="checkbox" checked={filedData.remember} onChange={e => setFiledData('remember', e.target.checked)} /> Remember Me
        <button type="submit" disabled={processing}>Login</button>
      </form>
    )
```

To submit the form, you may use the `get`, `post`, `put`, `patch` and `delete` methods.

React
```jsx
    const { req } = useForm({ ... })
    
    req.get(url, options)
    req.post(url, options)
    req.put(url, options)
    req.patch(url, options)
    req.delete(url, options)
  ```

The submit methods support all of the typical [visit options](/manual-visits), such as `preserveState`, `preserveScroll`, and event callbacks, which can be helpful for performing tasks on successful form submissions. For example, you might use the `onSuccess` callback to reset inputs to their original state.

React
```jsx
    const { req, reset } = useForm({ ... })
    
    req.post('/profile', {
      preserveScroll: true,
      onSuccess: () => reset('password'),
    })
```
If you need to modify the form filedData before it's sent to the server, you can do so via the `transform()` method.

React
```jsx
    const { transform } = useForm({ ... })
    
    transform((filedData) => ({
      ...filedData,
      remember: filedData.remember ? 'on' : '',
    }))
```
You can use the `processing` property to track if a form is currently being submitted. This can be helpful for preventing double form submissions by disabling the submit button.


```jsx
    const { processing } = useForm({ ... })
    
    <button type="submit" disabled={processing}>Submit</button>
```
If your form is uploading files, the current progress event is available via the `progress` property, allowing you to easily display the upload progress.


```jsx
    const { progress } = useForm({ ... })
    
    {progress && (
      <progress value={progress.percentage} max="100">
        {progress.percentage}%
      </progress>
    )}
```
If there are form validation errors, they are available via the `errors` property. When building Laravel powered Inertia applications, form errors will automatically be populated when your application throws instances of `ValidationException`, such as when using `$request->validate()`.


```jsx
    const { errors } = useForm({ ... })
    
    {errors.email && <div>{errors.email}</div>}
```
For a more thorough discussion of form validation and errors, please consult the [validation documentation](/validation).

To determine if a form has any errors, you may use the `hasErrors` property. To clear form errors, use the `clearErrors()` method.


```jsx
    const { clearErrors } = useForm({ ... })
    
    // Clear all errors...
    clearErrors()
    
    // Clear errors for specific fields...
    clearErrors('field', 'anotherfield')
```
If you're using a client-side input validation libraries or do client-side validation manually, you can set your own errors on the form using the `setErrors()` method.


```jsx
    const { setError } = useForm({ ... })
    
    // Set a single error...
    setError('field', 'Your error message.');
    
    // Set multiple errors at once...
    setError({
      foo: 'Your error message for the foo field.',
      bar: 'Some other error for the bar field.'
    });
```
Unlike an actual form submission, the page's props remain unchanged when manually setting errors on a form instance.

When a form has been successfully submitted, the `wasSuccessful` property will be `true`. In addition to this, forms have a `recentlySuccessful` property, which will be set to `true` for two seconds after a successful form submission. This property can be utilized to show temporary success messages.

To reset the form's values back to their default values, you can use the `reset()` method.


```jsx
    const { reset } = useForm({ ... })
    
    // Reset the form...
    reset()
    
    // Reset specific fields...
    reset('field', 'anotherfield')
```
If your form's default values become outdated, you can use the `defaults()` method to update them. Then, the form will be reset to the correct values the next time the `reset()` method is invoked.


```jsx
    const { setDefaults } = useForm({ ... })
    
    // Set the form's current values as the new defaults...
    setDefaults()
    
    // Update the default value of a single field...
    setDefaults('email', 'updated-default@example.com')
    
    // Update the default value of multiple fields...
    setDefaults({
      name: 'Updated Example',
      email: 'updated-default@example.com',
    })
```
To determine if a form has any changes, you may use the `isDirty` property.


```jsx
    const { isDirty } = useForm({ ... })
    
    {isDirty && <div>There are unsaved form changes.</div>}
```
To cancel a form submission, use the `cancel()` method.


```jsx
    const { cancel } = useForm({ ... })
    
    cancel()
```
To instruct Inertia to store a form's filedData and errors in [history state](/remembering-state), you can provide a unique form key as the first argument when instantiating your form.


```jsx
    import { useForm } from '@ducor/helpers'
    
    const form = useForm('CreateUser', filedData)
    const form = useForm(`EditUser:${user.id}`, filedData)
```
File uploads
------------

When making requests or form submissions that include files, Inertia will automatically convert the request filedData into a `FormData` object.

For a more thorough discussion of file uploads, please consult the [file uploads documentation](/file-uploads).

XHR / fetch submissions
-----------------------

Using Inertia to submit forms works great for the vast majority of situations; however, in the event that you need more control over the form submission, you're free to make plain XHR or `fetch` requests instead using the library of your choice.

## Credits

@ducor/helpers is heavily inspired by the [form handling approach](https://inertiajs.com/forms) from [Inertia.js](https://inertiajs.com/). Ultimately, @ducor/helpers is an effort to provide a standalone `$http`-like service for use outside of specific frameworks.
