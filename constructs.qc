%-- BEGIN EXECUTION --%

// FOR loop implementation (counting 1 to 5)
STD::OUT "FOR loop example:"
DECLARE i = 1
IF i <= 5
  STD::OUT i
  ASSIGN i i + 1
  JUMP -2
END

// DO-WHILE implementation (counts down from 5)
STD::OUT "DO-WHILE example:"
DECLARE x = 5
STD::OUT x
ASSIGN x x - 1
IF x >= 0
  JUMP -2
END

// SWITCH-CASE pattern (checking values 1,2,3)
STD::OUT "SWITCH-CASE example:"
DECLARE value = 2
IF value == 1
  STD::OUT "One"
  JUMP +7
END
IF value == 2
  STD::OUT "Two"
  JUMP +4
END
IF value == 3
  STD::OUT "Three"
  JUMP +1
END
STD::OUT "Done"

// Ternary operator: result = condition ? value1 : value2
STD::OUT "Ternary example:"
DECLARE condition = 1
DECLARE ternary_result = 0
IF condition
  ASSIGN ternary_result 10
  JUMP +1
END
ASSIGN ternary_result 20

STD::OUT ternary_result

%-- TERMINATE EXECUTION --%