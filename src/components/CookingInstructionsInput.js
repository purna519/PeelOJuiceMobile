import React, {useState, useEffect} from 'react';
import {View, TextInput, Text, StyleSheet} from 'react-native';

const CookingInstructionsInput = ({value, onChange, onEndEditing, maxWords = 30}) => {
  const [text, setText] = useState(value || '');
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    setText(value || '');
    countWords(value || '');
  }, [value]);

  const countWords = (str) => {
    const trimmed = str.trim();
    if (!trimmed) {
      setWordCount(0);
      return 0;
    }
    const count = trimmed.split(/\s+/).length;
    setWordCount(count);
    return count;
  };

  const handleChange = (newText) => {
    const words = newText.trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) {
      setText(newText);
      setWordCount(words.length);
      onChange(newText);
    } else {
      // Allow deleting/editing even if over limit, just warn or cap?
      // Requirement said "Character limit for instructions(30 words)"
      // Better to check if we are adding more words.
      // For simple UX, let's just count words and only block if creating a new word over limit
      // But actually, simpler is to just update local state and validate on blur?
      // Let's rely on the words check. if deleting, words decrease.
      if (newText.length < text.length) {
         setText(newText);
         onChange(newText);
         countWords(newText);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Cooking Instructions <Text style={styles.optional}>(Optional)</Text>
      </Text>
      <TextInput
        style={styles.input}
        placeholder="E.g., Less sugar, extra ice..."
        placeholderTextColor="#999"
        value={text}
        onChangeText={handleChange}
        onEndEditing={() => onEndEditing && onEndEditing(text)}
        multiline
        maxLength={200} // Also cap chars to be safe with DB
        textAlignVertical="top"
      />
      <Text style={[styles.wordCount, wordCount >= maxWords && styles.limitReached]}>
        {wordCount}/{maxWords} words
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  optional: {
    color: '#999',
    fontWeight: 'normal',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#1E1E1E',
    backgroundColor: '#FAFAFA',
    minHeight: 60,
  },
  wordCount: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  limitReached: {
    color: '#F44336',
  },
});

export default CookingInstructionsInput;
