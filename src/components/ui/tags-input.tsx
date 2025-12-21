import * as React from "react"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TagsInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  suggestions?: string[]
  onTagsChange?: (tags: string[]) => void
  value?: string
}

export const TagsInput = React.forwardRef<HTMLInputElement, TagsInputProps>(
  ({ 
    suggestions = [], 
    onTagsChange,
    value = '',
    onChange,
    className,
    ...props 
  }, ref) => {
    const [tags, setTags] = React.useState<string[]>(
      value ? value.split(',').map(t => t.trim()).filter(Boolean) : []
    )
    const [input, setInput] = React.useState('')
    const [showSuggestions, setShowSuggestions] = React.useState(false)
    const [filteredSuggestions, setFilteredSuggestions] = React.useState<string[]>([])
    const inputRef = React.useRef<HTMLInputElement>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Update tags when external value changes
    React.useEffect(() => {
      const newTags = value ? value.split(',').map(t => t.trim()).filter(Boolean) : []
      const currentTagsString = tags.join(', ')
      const newTagsString = newTags.join(', ')
      
      if (currentTagsString !== newTagsString) {
        setTags(newTags)
      }
    }, [value])

    // Filter suggestions based on input
    React.useEffect(() => {
      if (input.trim()) {
        const inputLower = input.toLowerCase()
        const filtered = suggestions.filter(
          (suggestion) =>
            suggestion.toLowerCase().includes(inputLower) &&
            !tags.some(tag => tag.toLowerCase() === suggestion.toLowerCase())
        )
        setFilteredSuggestions(filtered)
        setShowSuggestions(filtered.length > 0)
      } else {
        setFilteredSuggestions([])
        setShowSuggestions(false)
      }
    }, [input, suggestions, tags])

    const handleAddTag = (tag: string) => {
      const trimmedTag = tag.trim()
      if (trimmedTag && !tags.some(t => t.toLowerCase() === trimmedTag.toLowerCase())) {
        const newTags = [...tags, trimmedTag]
        setTags(newTags)
        setInput('')
        setShowSuggestions(false)
        onTagsChange?.(newTags)
        // Trigger onChange with comma-separated tags for form compatibility
        if (onChange) {
          const mockEvent = {
            target: { value: newTags.join(', ') }
          } as React.ChangeEvent<HTMLInputElement>
          onChange(mockEvent)
        }
      }
    }

    const handleRemoveTag = (index: number) => {
      const newTags = tags.filter((_, i) => i !== index)
      setTags(newTags)
      onTagsChange?.(newTags)
      // Trigger onChange with comma-separated tags for form compatibility
      if (onChange) {
        const mockEvent = {
          target: { value: newTags.join(', ') }
        } as React.ChangeEvent<HTMLInputElement>
        onChange(mockEvent)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault()
        if (filteredSuggestions.length > 0) {
          handleAddTag(filteredSuggestions[0])
        } else if (input.trim()) {
          handleAddTag(input)
        }
      } else if (e.key === 'Backspace' && !input && tags.length > 0) {
        handleRemoveTag(tags.length - 1)
      }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value)
    }

    const handleFocus = () => {
      if (input.trim()) {
        setShowSuggestions(true)
      } else if (suggestions.length > 0) {
        // Show all suggestions when focused with empty input
        const availableSuggestions = suggestions.filter(
          (s) => !tags.some(tag => tag.toLowerCase() === s.toLowerCase())
        )
        setFilteredSuggestions(availableSuggestions)
        setShowSuggestions(availableSuggestions.length > 0)
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
      // Only hide suggestions if clicking outside the container
      setTimeout(() => {
        if (!containerRef.current?.contains(document.activeElement)) {
          setShowSuggestions(false)
        }
      }, 100)
    }

    // Handle clicking on suggestions
    const handleSuggestionClick = (suggestion: string) => {
      handleAddTag(suggestion)
      inputRef.current?.focus()
    }

    return (
      <div ref={containerRef} onBlur={handleBlur} className="relative space-y-2">
        <div className={cn(
          "flex flex-wrap gap-2 p-2 border border-input rounded-xl bg-background min-h-12 sm:min-h-14 focus-within:ring-1 focus-within:ring-ring",
          className
        )}>
          {tags.map((tag, index) => (
            <div
              key={index}
              className="flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-sm font-medium"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(index)}
                className="ml-1 hover:opacity-70 focus:outline-none"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={tags.length === 0 ? "Add tags, separated by commas" : "Add more tags..."}
            className="flex-1 min-w-[100px] bg-transparent outline-none text-sm sm:text-base placeholder-muted-foreground"
            {...props}
          />
        </div>

        {/* Hidden input for form compatibility */}
        <input
          ref={ref}
          type="hidden"
          value={tags.join(', ')}
          {...props}
        />

        {/* Suggestions dropdown - Portal-like positioning */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-[9999] mt-1 border border-input bg-background rounded-xl shadow-md max-h-64 overflow-y-auto">
            {filteredSuggestions.slice(0, 10).map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:outline-none transition-colors",
                  index === 0 && "rounded-t-xl",
                  index === filteredSuggestions.length - 1 && "rounded-b-xl"
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
)
TagsInput.displayName = "TagsInput"
