// Programming foundations. Original descriptions; references are coverage checks only.
// after: prerequisites (necessary at the stated scope) · helpedBy: supporting skills · helps: this
// skill supports another · related: association without order. Each value is the edge rationale.
export const subdomain = 'Programming foundations';
export const nodes = [
  { id: 'c-values-types', name: 'Values and data types', icon: 'code', refs: ['PYTUT', 'CS2023', 'CSTA'],
    summary: 'Recognize the type of a value, such as integer, floating-point number, text string, or Boolean, and predict which operations that type allows.',
    details: `Every value a program handles has a type that decides what can be done with it. 7 is an integer, 7.0 is a floating-point number, "7" is a text string, and True is a Boolean. The same operator can mean different things: in Python, 7 + 7 gives 14, "7" + "7" gives "77", and 7 + "7" is refused with a TypeError because the language will not guess which meaning you wanted. Division comes in two kinds as well: 7 // 2 is 3, while 7 / 2 is 3.5.

You have this skill when you can look at a literal or short expression and state its type and result before running it, including the special value None (null in other languages) that stands for "no value". A telling check is knowing that input() returns the string "42" when someone types 42, so it is text until converted.` },
  { id: 'c-variables', name: 'Variables and assignment', icon: 'code', refs: ['PYTUT', 'CS2023', 'CSTA'],
    after: { 'c-values-types': 'Assignment stores values, so recognizing the kinds of value a name can hold comes first.' },
    related: { 'm-expr': 'An algebraic variable stands for a general or unknown number, while a program variable is a named slot updated over time; the notation is shared but the meaning differs.' },
    summary: 'Store a value under a name, reassign it, and trace how each variable changes line by line.',
    details: `Assignment binds a name to a value: after speed = 2.5, the name speed refers to 2.5 until something reassigns it. The right-hand side is evaluated first, so count = count + 1 reads the old count and stores a new one. It is an instruction, not an equation that could never be true. A name must be assigned before it is used, and a misspelt name either creates a second variable or raises an error rather than updating the one you meant.

The core check is tracing. Given a = 3, then b = a, then a = a * 2, you can say that a is 6 and b is still 3, because b received the value that a held at that moment. Swapping two values, keeping a running total and remembering the largest value seen so far are the standard patterns built from this one idea.` },
  { id: 'c-expressions', name: 'Expressions and operators', icon: 'code', refs: ['PYTUT', 'CS2023'],
    after: { 'c-variables': 'Expressions combine variables with operators, so named values must already be familiar.' },
    helpedBy: { 'm-logic': 'Truth tables for and, or, and not are exactly how compound conditions in code evaluate.' },
    related: { 'm-modular': 'The remainder operator % computes the remainders that modular arithmetic reasons about.' },
    summary: 'Evaluate arithmetic, comparison, and logical expressions, applying operator precedence, integer division, and remainder correctly.',
    details: `An expression combines values, variables and operators into one result. Precedence decides grouping: 2 + 3 * 4 is 14, not 20, and parentheses override it. Comparisons such as x < 10 or a == b produce Booleans, which and, or and not combine. Most languages stop evaluating these early, so x != 0 and 10 / x > 2 never divides by zero. The remainder operator % gives what is left after division, so n % 2 == 0 tests for an even number.

Mistakes here are quiet. Writing = where == was meant, expecting 0.1 * 3 to equal 0.3 exactly, or assuming -7 // 2 is -3 when Python gives -4 because it rounds toward negative infinity, all run without complaint and produce wrong results. You have the skill when you can evaluate a mixed expression by hand, add parentheses to make intent explicit and rewrite a tangled condition as a clearer equivalent.` },
  { id: 'c-type-conversion', name: 'Type conversion and formatted output', icon: 'code', refs: ['PYTUT'],
    after: { 'c-expressions': 'Conversion matters because operators behave differently on text and numbers, which is learned with expressions.' },
    summary: 'Convert between text and numbers deliberately, and format numbers as readable text with controlled precision.',
    details: `Programs constantly move between text and numbers. Keyboard input, files and serial lines arrive as text, while calculations need numbers. Explicit conversions such as int("42"), float("3.3") and str(7) do this, and they fail loudly on bad input: int("4.5") and int("abc") raise errors rather than guessing. Converting a float to an integer truncates toward zero, so int(2.9) is 2; rounding is a separate, deliberate step.

The reverse direction is formatting. f"{voltage:.2f} V" turns 3.14159 into "3.14 V", and f"{42:05d}" gives "00042". A good self-check: given the text "12,7.5" from a user or device, you can convert both fields to suitable numeric types and print a computed result with a fixed number of decimal places, without accidentally joining strings where you meant to add numbers.` },
  { id: 'c-strings', name: 'Text strings and parsing', icon: 'code', refs: ['PYTUT', 'CS2023'],
    after: { 'c-type-conversion': 'Parsing extracts fields as text and then converts them, so explicit conversion is needed first.' },
    summary: 'Index, slice, search, split, and join strings to extract fields from lines of text.',
    details: `A string is an ordered sequence of characters, so it can be indexed and sliced: in "robot", s[0] is "r" and s[1:3] is "ob". Methods do the routine work. split(",") breaks "x=1.2,y=3.4" into two fields, strip() removes stray spaces and newline characters, find() locates a substring and join() builds one string from parts. In Python, Java and many other languages strings are immutable, so these operations return new strings rather than changing the original.

Parsing structured text is the payoff. Given a log line such as "t=0.25 left=312 right=309", you can split it into key=value pairs, convert the numbers and reject a malformed line instead of crashing on it. Part of the skill is recognizing when simple splitting stops being safe, for example CSV fields that contain quoted commas, and using a proper parser instead.` },
  { id: 'c-conditions', name: 'Conditional branching', icon: 'code', refs: ['PYTUT', 'CS2023', 'CSTA'],
    after: { 'c-expressions': 'Every branch is chosen by a Boolean expression, so comparisons and logical operators come first.' },
    summary: 'Choose between paths with if, else-if, and else, ordering the tests so every case reaches exactly one intended branch.',
    details: `A conditional runs a block only when its condition is true. A chain of if, elif and else is checked from the top and the first true test wins, so order matters: testing temperature > 30 before temperature > 80 means the second branch can never run. Nested conditions express "only if also", and they can often be flattened with and or an early return into something easier to read.

The skill shows in covering every case on purpose. For a battery monitor with thresholds at 20 % and 5 %, you can write branches that treat exactly 20 and exactly 5 as intended, add a final else for impossible or unexpected readings, and test those boundary values rather than only comfortable values in the middle of each range.` },
  { id: 'c-loops', name: 'Loops and iteration', icon: 'code', refs: ['PYTUT', 'CS2023', 'CSTA'],
    after: { 'c-conditions': 'A loop continues or stops according to a condition, so conditional logic must already be reliable.' },
    summary: 'Repeat work with for and while loops, choosing bounds and exit conditions so a loop runs the intended number of times and terminates.',
    details: `A for loop repeats once per item or index: for i in range(5) runs with i from 0 to 4. A while loop repeats as long as its condition holds, which suits waiting for an event or iterating until a value settles. break leaves a loop early and continue skips to the next pass. Something inside every while loop must eventually make its condition false, or the loop never ends.

Off-by-one errors are the classic failure. range(1, 10) stops at 9, and a loop over indices 0 to len(a) inclusive reads past the end. You have the skill when you can predict exactly how many times a loop body runs, write accumulator loops such as summing readings or finding a maximum, and turn a for loop into an equivalent while loop and back.` },
  { id: 'c-functions', name: 'Functions, parameters, and return values', icon: 'code', refs: ['PYTUT', 'CS2023', 'CSTA'],
    after: { 'c-expressions': 'A function computes its result with expressions, and each argument is itself an expression.' },
    related: { 'm-function': 'A mathematical function maps each input to one output; a program function may also change state, return nothing, or give different results for the same input.' },
    summary: 'Define functions that take parameters and return results, and call them with the right arguments in the right order.',
    details: `A function packages a computation under a name. def wheel_speed(rpm, diameter): return rpm * 3.1416 * diameter / 60 can then be called wherever that calculation is needed. Parameters are the names in the definition and arguments are the values supplied in a call. return hands a result back and ends the function at once. A function that never returns a value gives back None, a common surprise when a result was printed instead of returned.

Good functions do one job, receive their inputs as parameters rather than reading scattered global values, and are named for what they compute. You can split a long script into functions, trace a call that feeds one function's result into another, and explain why printing inside a function is not the same as returning a value to the caller.` },
  { id: 'c-scope', name: 'Variable scope and lifetime', icon: 'code', refs: ['PYTUT', 'CS2023'],
    after: { 'c-functions': 'Scope rules are defined by function boundaries, so functions must be understood first.' },
    summary: 'Predict which variable a name refers to inside and outside a function, and how long each variable exists.',
    details: `Scope is the region of code in which a name is visible. A variable assigned inside a function is local: it comes into existence when the call starts, disappears when it returns and is separate from any variable of the same name outside. In Python, assigning to a name anywhere in a function makes it local throughout that function, which is why reading a global and later assigning to it in the same function raises UnboundLocalError. Unlike Python, C and Java have block scope, where a variable declared inside a loop or if-block ends with that block.

Shadowing, where an inner name hides an outer one, is legal but confusing. The practical goal is avoiding hidden dependencies: pass values in as parameters and return results instead of having functions quietly read and modify globals. You can trace a program in which the same name appears at several levels and say which value each line uses.` },
  { id: 'c-collections', name: 'Lists, dictionaries, and sets', icon: 'code', refs: ['PYTUT', 'CS2023'],
    after: { 'c-loops': 'Most work with collections means iterating over their items, which requires loops.' },
    helpedBy: { 'm-set': 'Set membership, union, and intersection are exactly the operations a set collection provides.' },
    summary: 'Store groups of values in ordered lists, key-value dictionaries, and sets, then index, update, test membership, and iterate over them.',
    details: `Collections hold many values under one name. A list keeps items in order and is indexed from 0, so readings[0] is the first element and readings[-1] the last; append adds an item and slicing copies a range. A dictionary maps keys to values, as in limits = {"shoulder": 90, "elbow": 135}, and looks items up by key rather than by position. A set holds unique items and answers "is this present?" quickly, and a tuple is a fixed-length sequence often used for coordinates.

Choosing the collection is part of the skill: a dictionary when you look things up by name, a list when order or position matters, a set when only membership matters. Typical errors are indexing past the end, modifying a list while looping over it and assuming a missing key reads as zero when it raises KeyError. You can loop over a dictionary's keys and values, count occurrences and group items by a property.` },
  { id: 'c-references', name: 'References, mutation, and aliasing', icon: 'code', refs: ['PYTUT', 'CS2023'],
    after: { 'c-collections': 'Aliasing surprises appear with mutable collections such as lists and dictionaries.', 'c-functions': 'Passing a mutable object to a function is where shared references most often cause bugs.' },
    summary: 'Distinguish changing an object in place from rebinding a name, and predict when two names share one mutable object.',
    details: `In Python, JavaScript, Java and many other languages, a variable that holds a list or object holds a reference to it. After b = a, both names refer to the same list, so b.append(4) also changes what a shows. Rebinding, as in b = [9], only moves the name b and leaves a untouched. Passing a list to a function works the same way: the function can change the caller's list in place, which is sometimes the purpose and often a bug.

The skill is predicting and controlling these effects. You copy with list(a) or a.copy() when independence is needed, you know that a shallow copy of a list of lists still shares the inner lists, and you can explain why a mutable default argument such as def f(items=[]) keeps its contents between calls. This model of names pointing at objects is also the bridge to pointers in lower-level languages.` },
  { id: 'c-errors', name: 'Exceptions and error handling', icon: 'code', refs: ['PYTUT', 'CS2023'],
    after: { 'c-functions': 'Exceptions travel up through function calls, so calls and returns must be understood first.', 'c-conditions': 'Deciding whether to retry, fall back, or stop is branching logic.' },
    summary: 'Raise, catch, and clean up after errors so a program fails clearly or recovers on purpose, never silently.',
    details: `When an operation cannot complete, such as opening a missing file, converting "abc" to a number or dividing by zero, many languages raise an exception that travels up the call stack until something handles it. try and except (catch in other languages) handle a specific error, finally or a with-block runs cleanup such as closing a port whatever happens, and raise reports a problem your own code has detected, such as a joint angle outside its limits. C and Go report errors through return values instead, which must be checked explicitly.

Good error handling is selective. Catch only the errors you can do something useful about, at the point where recovery is possible, and never use a bare except that swallows everything, because it hides the real fault. You can read a traceback to find where an exception started, choose between retrying, falling back to a safe value and stopping, and write messages that state what failed and with which input.` },
  { id: 'c-objects', name: 'Classes and objects', icon: 'code', refs: ['PYTUT', 'CS2023'],
    after: { 'c-functions': 'Methods are functions attached to objects.', 'c-scope': 'An object\'s attributes outlive any single method call, which only makes sense once local lifetime is clear.' },
    summary: 'Group related data and the functions that act on it into classes, create instances, and keep each object\'s state valid through its methods.',
    details: `A class defines a kind of object: its attributes, which hold data, and its methods, which act on that data. A Motor class with a speed attribute and a set_speed() method lets every Motor instance keep its own state, and self (this in other languages) refers to the particular instance a method was called on. A constructor such as __init__ gives each new object a valid starting state.

The benefit is encapsulation. If set_speed() clamps values to the permitted range, the rest of the program cannot push the object into an invalid state by accident. You can write a Motor class whose set_speed() clamps to the permitted range and show that no public method can leave its speed outside it, decide which data belongs inside an object and which should be passed in, and recognize when a plain function or dictionary would be simpler. Inheritance builds on this, but composition, with one object holding others, is usually the more useful tool.` }
];
