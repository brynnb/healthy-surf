import '@src/Popup.css';
import { useStorageSuspense, withErrorBoundary, withSuspense, useKeywords } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { ComponentPropsWithoutRef, FormEvent } from 'react';

const Popup = () => {
  const theme = useStorageSuspense(exampleThemeStorage);
  const isLight = theme === 'light';

  const { keywords, addKeyword, removeKeyword } = useKeywords();

  const handleAddKeyword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem('keyword') as HTMLInputElement;
    if (input.value.trim() !== '') {
      addKeyword(input.value.trim());
      form.reset();
    }
  };

  return (
    <div className={`App ${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}>
      <header className={`App-header ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
        <h1>Healthy Surf</h1>
        <form onSubmit={handleAddKeyword} className="flex items-center mt-4">
          <input type="text" name="keyword" placeholder="Add a new keyword" className="p-2 rounded" />
          <button
            type="submit"
            className="ml-2 font-bold py-1 px-4 rounded shadow hover:scale-105 bg-green-500 text-white">
            Add
          </button>
        </form>
        <div className="mt-4">
          <h2>Keywords:</h2>
          <ul>
            {keywords.map((keyword: string, index: number) => (
              <li key={index}>
                {keyword}
                <button onClick={() => removeKeyword(keyword)} className="ml-2 text-red-500 hover:text-red-700">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
        {/* <ToggleButton>Toggle light/dark mode</ToggleButton> */}
      </header>
    </div>
  );
};

// const ToggleButton = (props: ComponentPropsWithoutRef<'button'>) => {
//   const theme = useStorageSuspense(exampleThemeStorage);
//   return (
//     <button
//       className={
//         props.className +
//         ' ' +
//         'font-bold mt-4 py-1 px-4 rounded shadow hover:scale-105 ' +
//         (theme === 'light' ? 'bg-white text-black shadow-black' : 'bg-black text-white')
//       }
//       onClick={exampleThemeStorage.toggle}>
//       {props.children}
//     </button>
//   );
// };

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
