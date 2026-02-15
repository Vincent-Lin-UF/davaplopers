from abc import ABC, abstractmethod
from typing import Any

class Tool(ABC):
    @property 
    @abstractmethod
    def name(self) -> str:
        pass 

    @property
    @abstractmethod
    def description(self) -> str:
        pass 

    @property
    @abstractmethod
    def parameters(self) -> str:
        pass 

    @abstractmethod
    def execute(self, **kwargs) -> Any:
        pass 

    def to_llm_tool(self) -> dict:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }
