%-- BEGIN EXECUTION --%

DECLARE count = 10
DECLARE prev = 0
DECLARE current = 1
DECLARE next = 0
DECLARE i = 0

STD::OUT prev
STD::OUT current

ASSIGN i i + 1
IF i < count
  ASSIGN next current + prev
  ASSIGN prev current
  ASSIGN current next
  STD::OUT current
  JUMP -5
END

%-- TERMINATE EXECUTION --%
