import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Button,
  Select,
} from '@chakra-ui/react';
import { useState } from 'react';

interface Frontmatter {
  name: string;
  category: string;
  description: string;
  tags: string[];
  used_by_agents: string[];
  required_knowledge: string[];
}

interface FrontmatterFormProps {
  frontmatter: Frontmatter;
  onChange: (frontmatter: Frontmatter) => void;
  categories: string[];
}

export function FrontmatterForm({ frontmatter, onChange, categories }: FrontmatterFormProps) {
  const [newTag, setNewTag] = useState('');

  const handleChange = (field: keyof Frontmatter, value: string | string[]) => {
    onChange({ ...frontmatter, [field]: value });
  };

  const addTag = () => {
    if (newTag.trim() && !frontmatter.tags.includes(newTag.trim())) {
      handleChange('tags', [...frontmatter.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    handleChange(
      'tags',
      frontmatter.tags.filter((t) => t !== tag)
    );
  };

  return (
    <VStack align="stretch" spacing={4}>
      <FormControl isRequired>
        <FormLabel fontSize="sm">Name</FormLabel>
        <Input
          value={frontmatter.name}
          onChange={(e) => handleChange('name', e.target.value)}
          size="sm"
        />
      </FormControl>

      <FormControl isRequired>
        <FormLabel fontSize="sm">Category</FormLabel>
        <Select
          value={frontmatter.category}
          onChange={(e) => handleChange('category', e.target.value)}
          size="sm"
        >
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
          <option value="custom">+ New category</option>
        </Select>
      </FormControl>

      <FormControl isRequired>
        <FormLabel fontSize="sm">Description</FormLabel>
        <Textarea
          value={frontmatter.description}
          onChange={(e) => handleChange('description', e.target.value)}
          size="sm"
          rows={2}
        />
      </FormControl>

      <FormControl isRequired>
        <FormLabel fontSize="sm">Tags</FormLabel>
        <Wrap mb={2}>
          {frontmatter.tags.map((tag) => (
            <WrapItem key={tag}>
              <Tag size="sm" colorScheme="blue">
                <TagLabel>{tag}</TagLabel>
                <TagCloseButton onClick={() => removeTag(tag)} />
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
        <HStack>
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
            placeholder="Add tag..."
            size="sm"
          />
          <Button onClick={addTag} size="sm" colorScheme="blue">
            Add
          </Button>
        </HStack>
      </FormControl>
    </VStack>
  );
}
