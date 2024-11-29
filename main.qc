%-- BEGIN EXECUTION --%

  DECLARE x = 10
  STD::OUT x
  ASSIGN x x - 1
  WAIT 1000
  IF x < 0
    JUMP 9
  ELSE
    JUMP 1
  END
  STD::OUT "loop"

%-- TERMINATE EXECUTION --%