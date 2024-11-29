%-- BEGIN EXECUTION --%

// Function that calculates sum and returns larger number
FUNC max_and_sum a b
  DECLARE sum = a + b
  STD::OUT "Sum is:"
  STD::OUT sum
  
  IF a > b
    RET a
  END
  RET b
END

// Function that generates fibonacci number at position n
FUNC fib n
  IF n <= 1
    RET n
  END
  
  DECLARE prev = 0
  DECLARE curr = 1
  DECLARE i = 1
  
  IF i < n
    DECLARE temp = curr
    ASSIGN curr curr + prev
    ASSIGN prev temp
    ASSIGN i i + 1
    JUMP -4
  END
  
  RET curr
END

// Main execution
STD::OUT "Testing max_and_sum:"
DECLARE result = CALL max_and_sum 15 10
STD::OUT "Larger number was:"
STD::OUT result

STD::OUT "Testing fibonacci:"
DECLARE fib_result = CALL fib 7
STD::OUT "Fibonacci number at position 7 is:"
STD::OUT fib_result

%-- TERMINATE EXECUTION --%
