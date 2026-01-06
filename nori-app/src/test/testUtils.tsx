import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';

// Custom render function that includes ChakraProvider
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, {
    wrapper: ({ children }) => <ChakraProvider>{children}</ChakraProvider>,
    ...options,
  });
}

export * from '@testing-library/react';
export { customRender as render };
