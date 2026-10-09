import { useState } from 'react';


// Import shared components
import {
  PageContainer,
  ContentSection,
  SectionHeader,
  Card,
  GridLayout,
  DataTable,
  StatusBadge,

  SearchInput,
  FilterSelect,
  FormSection,
  FormRow,
  LoadingSpinner,
  AlertMessage,
  Breadcrumbs,
  Tabs,
  BackButton,
} from '@/components/shared';

// Import UI components
import { Button } from '@/components/ui/button';


// Import icons
import { Plus, FileText, Users, Settings, Search } from 'lucide-react';

// Import store hooks
import { useUIStore } from '@/lib/store';

// Import custom hooks
import { useExampleItems, useCreateExampleItem, useUpdateExampleItem, useDeleteExampleItem, type ExampleItem } from '@/hooks/use-example-data';

const ExamplePage: React.FC = () => {
  const { theme, setTheme } = useUIStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch data with React Query
  const { data: items, isLoading, error } = useExampleItems();
  const createItem = useCreateExampleItem();
  const updateItem = useUpdateExampleItem();
  const deleteItem = useDeleteExampleItem();

  // Filter items based on search query and status filter
  const filteredItems = items?.filter(item => {
    const matchesSearch = searchQuery
      ? item.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesStatus = statusFilter
      ? item.status === statusFilter
      : true;
    return matchesSearch && matchesStatus;
  }) || [];

  // Table columns
  const columns = [
    { header: 'ID', accessorKey: 'id' as keyof ExampleItem },
    { header: 'Name', accessorKey: 'name' as keyof ExampleItem },
    {
      header: 'Status',
      cell: (item: any) => <StatusBadge status={item.status} />,
    },
    { header: 'Date', accessorKey: 'date' as keyof ExampleItem },
    {
      header: 'Actions',
      cell: (item: any) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Toggle status between active and completed
              const newStatus = item.status === 'active' ? 'completed' : 'active';
              updateItem.mutate({
                ...item,
                status: newStatus,
              });
            }}
          >
            Toggle
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              deleteItem.mutate(item.id);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];



  // Tabs content
  const tabs = [
    {
      value: 'overview',
      label: 'Overview',
      icon: <FileText className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <Card>
            <h3 className="text-lg font-medium mb-2">Welcome to the Example Page</h3>
            <p>This page demonstrates the use of our shared components and state management.</p>
          </Card>

          <AlertMessage
            type="info"
            title="Information"
            message="This is an example page showing the usage of our shared components."
          />
        </div>
      ),
    },
    {
      value: 'items',
      label: 'Items',
      icon: <FileText className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-end">
            <div className="flex-1">
              <SearchInput
                placeholder="Search items..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>
            <FilterSelect
              label="Status"
              placeholder="All Statuses"
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'pending', label: 'Pending' },
                { value: 'completed', label: 'Completed' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-full md:w-48"
            />
          </div>

          <DataTable
            data={filteredItems}
            columns={columns}
            isLoading={isLoading}
            emptyState={{
              title: 'No items found',
              description: 'Try adjusting your search or filter to find what you\'re looking for.',
              icon: <Search className="h-10 w-10" />,
              action: (
                <Button onClick={() => {
                  createItem.mutate({
                    name: 'New Item',
                    status: 'pending',
                    date: new Date().toISOString().split('T')[0],
                  });
                }}>
                  Add Item
                </Button>
              ),
            }}
          />
        </div>
      ),
    },
    {
      value: 'settings',
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
      content: (
        <FormSection title="Settings" description="Manage your preferences">
          <FormRow label="Theme">
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
              >
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
              >
                Dark
              </Button>
            </div>
          </FormRow>
        </FormSection>
      ),
    },
  ];

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Examples', href: '/examples' },
    { label: 'Example Page' },
  ];

  // Handle loading and error states
  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <AlertMessage
          type="error"
          title="Error"
          message={`Failed to load items: ${error.message}`}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Breadcrumbs items={breadcrumbItems} className="mb-6" />

      <ContentSection>
        <SectionHeader
          title="Example Page"
          description="A demonstration of our shared components and state management"
          rightContent={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          }
        />

        <Tabs tabs={tabs} defaultValue="overview" />
      </ContentSection>

      <ContentSection>
        <SectionHeader title="Card Grid Example" />

        <GridLayout
          columns={{ sm: 1, md: 2, lg: 3 }}
          gap="lg"
          className="mt-4"
        >
          <Card
            title="Card 1"
            description="This is the first card"
            icon={<FileText className="h-5 w-5" />}
          >
            <p>Card content goes here</p>
          </Card>

          <Card
            title="Card 2"
            description="This is the second card"
            icon={<Users className="h-5 w-5" />}
          >
            <p>Card content goes here</p>
          </Card>

          <Card
            title="Card 3"
            description="This is the third card"
            icon={<Settings className="h-5 w-5" />}
          >
            <p>Card content goes here</p>
          </Card>
        </GridLayout>
      </ContentSection>

      <div className="mt-8">
        <BackButton label="Back to Dashboard" to="/dashboard" />
      </div>
    </PageContainer>
  );
};

export default ExamplePage;