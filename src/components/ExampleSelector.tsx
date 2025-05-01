import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileDown } from 'lucide-react';

interface ExampleSelectorProps {
  onSelect: (example: string) => void;
}

export function ExampleSelector({ onSelect }: ExampleSelectorProps) {
  const examples = [
    {
      name: 'Simple Object',
      json: JSON.stringify(
        {
          name: 'John Doe',
          age: 30,
          email: 'john@example.com',
          isActive: true,
        },
        null,
        2,
      ),
    },
    {
      name: 'Nested Object',
      json: JSON.stringify(
        {
          id: 1,
          user: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            address: {
              street: '123 Main St',
              city: 'Anytown',
              zipCode: '12345',
            },
          },
          orders: [
            { id: 101, product: 'Laptop', price: 999.99 },
            { id: 102, product: 'Phone', price: 699.99 },
          ],
        },
        null,
        2,
      ),
    },
    {
      name: 'Array of Objects',
      json: JSON.stringify(
        [
          {
            id: 1,
            name: 'Product A',
            price: 29.99,
            inStock: true,
          },
          {
            id: 2,
            name: 'Product B',
            price: 49.99,
            inStock: false,
          },
          {
            id: 3,
            name: 'Product C',
            price: 19.99,
            inStock: true,
          },
        ],
        null,
        2,
      ),
    },
    {
      name: 'Complex Structure',
      json: JSON.stringify(
        {
          company: 'Acme Inc.',
          founded: 1985,
          active: true,
          departments: [
            {
              name: 'Engineering',
              employees: [
                {
                  id: 'E001',
                  name: 'Alice Johnson',
                  skills: ['JavaScript', 'React', 'Node.js'],
                  projects: [
                    { id: 'P1', name: 'Website Redesign', completed: true },
                    { id: 'P2', name: 'Mobile App', completed: false },
                  ],
                },
                {
                  id: 'E002',
                  name: 'Bob Smith',
                  skills: ['Python', 'Django', 'AWS'],
                  projects: [
                    { id: 'P3', name: 'Data Pipeline', completed: false },
                  ],
                },
              ],
            },
            {
              name: 'Marketing',
              employees: [
                {
                  id: 'E003',
                  name: 'Carol Williams',
                  skills: ['SEO', 'Content Strategy', 'Analytics'],
                  projects: [
                    { id: 'P4', name: 'Brand Campaign', completed: true },
                  ],
                },
              ],
            },
          ],
          locations: {
            headquarters: {
              city: 'San Francisco',
              state: 'CA',
              country: 'USA',
            },
            branches: [
              { city: 'New York', state: 'NY', country: 'USA' },
              { city: 'London', country: 'UK' },
            ],
          },
        },
        null,
        2,
      ),
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <FileDown className="mr-1 h-4 w-4" />
          Load Example
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          {examples.map((example) => (
            <DropdownMenuItem
              key={example.name}
              onClick={() => onSelect(example.json)}
            >
              {example.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
